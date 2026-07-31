import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { api } from "../services/api";
import { authService } from "../services/auth";
import { clearAuthSession } from "../utils/authHelper";
import { trackAuth } from "../services/analytics/analytics";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authNotification, setAuthNotification] = useState(null);

  // Helper to generate a bulletproof avatar URL fallback hierarchy
  const getAvatarUrl = (authUser, profileData) => {
    if (authUser?.user_metadata?.avatar_url) return authUser.user_metadata.avatar_url;
    if (authUser?.user_metadata?.picture) return authUser.user_metadata.picture;
    if (profileData?.avatar_url) return profileData.avatar_url;
    if (profileData?.avatar) return profileData.avatar;

    const name = profileData?.full_name || authUser?.user_metadata?.full_name || authUser?.email?.split("@")[0] || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8A2BE2&color=fff&bold=true`;
  };

  /**
   * Dedicated Atomic Profile Synchronization Engine
   * Executes atomic DB upsert to sync profiles table with single call
   */
  const syncUserProfile = useCallback(async (authUser, providerName = "google") => {
    if (!authUser) return null;

    const email = authUser.email || "";
    const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split("@")[0] || "User";
    const avatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;
    const phone = authUser.user_metadata?.phone || authUser.phone || "";
    const now = new Date().toISOString();

    let dbProfile = null;

    try {
      // 1. Single atomic DB upsert in public.profiles
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: authUser.id,
            email,
            full_name: fullName,
            avatar_url: avatarUrl,
            provider: providerName || "google",
            updated_at: now,
            last_login_at: now
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (!error && data) {
        dbProfile = data;
      }
    } catch (err) {
      console.warn("Supabase profiles table upsert warning, proceeding with backend profile fetch:", err);
    }

    // 2. Fetch role & full record via backend /auth/me or DB profile
    let role = dbProfile?.role || "customer";
    let phoneNum = dbProfile?.phone || phone;

    try {
      const result = await api.get("/auth/me");
      if (result && result.status === "success" && result.data?.profile) {
        const backendProfile = result.data.profile;
        role = backendProfile.role || role;
        phoneNum = backendProfile.phone || phoneNum;
      }
    } catch (backendErr) {
      console.warn("Backend auth/me verification offline or using local state:", backendErr);
    }

    const mergedProfile = {
      id: authUser.id,
      email,
      full_name: dbProfile?.full_name || fullName,
      name: dbProfile?.full_name || fullName,
      role,
      phone: phoneNum,
      provider: dbProfile?.provider || providerName,
      avatar_url: getAvatarUrl(authUser, dbProfile),
      avatar: getAvatarUrl(authUser, dbProfile),
      created_at: dbProfile?.created_at || now,
      updated_at: now,
      last_login_at: now
    };

    const userObj = {
      id: authUser.id,
      email,
      name: mergedProfile.name,
      role: mergedProfile.role,
      phone: mergedProfile.phone,
      avatar: mergedProfile.avatar
    };

    setUser(userObj);
    setProfile(mergedProfile);
    localStorage.setItem("mn_current_user", JSON.stringify(userObj));

    // Also sync local customer store fallback for non-destructive backwards compatibility
    try {
      authService.getUserProfile(authUser.id);
    } catch (e) {
      // ignore
    }

    return mergedProfile;
  }, []);

  /**
   * Universal Extensible OAuth Provider Sign-In
   */
  const signInWithProvider = async (provider = "google") => {
    setLoading(true);
    setAuthNotification(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent"
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`${provider} OAuth failure:`, err);
      setAuthNotification({ type: "error", message: err.message || `Failed to sign in with ${provider}` });
      setLoading(false);
      throw err;
    }
  };

  const signInWithGoogle = () => signInWithProvider("google");

  /**
   * Email / Password Login
   */
  const signInWithEmail = async (email, password) => {
    setLoading(true);
    setAuthNotification(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // Fall back to backend auth REST service
        const loggedUser = await authService.login(email, password);
        setUser(loggedUser);
        const fullProfile = authService.getUserProfile(loggedUser.id);
        setProfile(fullProfile);
        trackAuth("login");
        setLoading(false);
        return loggedUser;
      }

      if (data.session) {
        setSession(data.session);
        localStorage.setItem("access_token", data.session.access_token);
        await syncUserProfile(data.user, "email");
        trackAuth("login");
      }

      setLoading(false);
      return data.user;
    } catch (err) {
      console.error("Login failed:", err);
      setAuthNotification({ type: "error", message: err.message || "Invalid credentials." });
      setLoading(false);
      throw err;
    }
  };

  /**
   * Email / Password Sign Up
   */
  const signUp = async (name, email, password, phone = "") => {
    setLoading(true);
    setAuthNotification(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone
          }
        }
      });

      if (error) {
        // Fall back to backend REST register API
        const signedUser = await authService.signup(name, email, password, phone);
        setUser(signedUser);
        setLoading(false);
        return signedUser;
      }

      if (data.user) {
        if (data.session) {
          setSession(data.session);
          localStorage.setItem("access_token", data.session.access_token);
          await syncUserProfile(data.user, "email");
        } else if (!data.user.email_confirmed_at) {
          setAuthNotification({
            type: "info",
            message: "Account created! Please check your email inbox to verify your account before logging in."
          });
        }
        trackAuth("signup");
      }

      setLoading(false);
      return data.user;
    } catch (err) {
      console.error("Sign up failed:", err);
      setAuthNotification({ type: "error", message: err.message || "Registration failed." });
      setLoading(false);
      throw err;
    }
  };

  /**
   * Universal Sign Out
   */
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      await authService.logout().catch(() => null);
    } catch (err) {
      console.error("Error during sign out:", err);
    } finally {
      clearAuthSession();
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);
      trackAuth("logout");
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        localStorage.setItem("access_token", data.session.access_token);
      }
      return data.session;
    } catch (err) {
      console.error("Failed to refresh session:", err);
      return null;
    }
  };

  // Profile mutation helpers
  const updateProfile = async (data) => {
    if (!user) return;
    const updated = await authService.updateProfile(user.id, data);
    setProfile(prev => ({ ...prev, ...updated }));
    const activeUser = authService.getCurrentUser();
    setUser(activeUser);
    return updated;
  };

  const saveAddress = async (address) => {
    if (!user) return;
    const updated = await authService.saveAddress(user.id, address);
    setProfile(prev => ({ ...prev, addresses: updated.addresses }));
    return updated.addresses;
  };

  const deleteAddress = async (addressId) => {
    if (!user) return;
    const updated = await authService.deleteAddress(user.id, addressId);
    setProfile(prev => ({ ...prev, addresses: updated.addresses }));
    return updated.addresses;
  };

  // Initialize auth & listen to onAuthStateChange
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          if (isMounted) {
            setSession(currentSession);
            localStorage.setItem("access_token", currentSession.access_token);
            await syncUserProfile(currentSession.user, currentSession.user.app_metadata?.provider || "google");
          }
        } else {
          // Fallback check local stored session if offline
          const token = localStorage.getItem("access_token");
          const cachedUser = authService.getCurrentUser();
          if (token && cachedUser) {
            setUser(cachedUser);
            setProfile(authService.getUserProfile(cachedUser.id));
          }
        }
      } catch (err) {
        console.error("Error during initial session verification:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (newSession?.user) {
          setSession(newSession);
          localStorage.setItem("access_token", newSession.access_token);
          await syncUserProfile(newSession.user, newSession.user.app_metadata?.provider || "google");
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
        setProfile(null);
        clearAuthSession();
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [syncUserProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        authNotification,
        setAuthNotification,
        isAdmin: profile?.role === "admin" || user?.role === "admin",
        isAuthenticated: !!user,
        signInWithProvider,
        signInWithGoogle,
        signInWithEmail,
        signUp,
        signOut,
        refreshSession,
        syncUserProfile,

        // Backwards compatibility aliases
        login: signInWithEmail,
        signup: signUp,
        logout: signOut,
        loginWithGoogle: signInWithGoogle,
        updateProfile,
        saveAddress,
        deleteAddress
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
