import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/auth";
import { api } from "../services/api";
import { clearAuthSession, isTokenExpired } from "../utils/authHelper";
import { trackAuth } from "../services/analytics/analytics";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to global logout event
  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
      setProfile(null);
      setLoading(false);
    };
    window.addEventListener("mn-auth-logout", handleAuthLogout);
    return () => window.removeEventListener("mn-auth-logout", handleAuthLogout);
  }, []);

  // Initialize auth state by verifying session against the backend
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        if (isTokenExpired(token)) {
          clearAuthSession();
          setLoading(false);
          return;
        }
        try {
          const result = await api.get("/auth/me");

          if (result && result.status === "success") {
            const backendProfile = result.data.profile;
            const mappedUser = {
              id: backendProfile.id,
              name: backendProfile.full_name || backendProfile.email?.split("@")[0] || "User",
              email: backendProfile.email,
              role: backendProfile.role || "customer",
              phone: backendProfile.phone || ""
            };

            setUser(mappedUser);
            localStorage.setItem("mn_current_user", JSON.stringify(mappedUser));

            const fullProfile = authService.getUserProfile(backendProfile.id);
            setProfile(fullProfile);
          } else {
            // Token has expired or is invalid
            clearAuthSession();
          }
        } catch (err) {
          if (err.status === 401 || err.status === 403) {
            // Never restore cached profile after an authentication failure
            clearAuthSession();
          } else {
            console.error("Failed to restore session via backend, falling back to local cache", err);
            // Network error or offline mode: fall back to cached session if available
            const activeUser = authService.getCurrentUser();
            if (activeUser) {
              setUser(activeUser);
              const fullProfile = authService.getUserProfile(activeUser.id);
              setProfile(fullProfile);
            }
          }
        }
      } else {
        localStorage.removeItem("mn_current_user");
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
      const fullProfile = authService.getUserProfile(loggedUser.id);
      setProfile(fullProfile);
      trackAuth("login");
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const loggedUser = await authService.loginWithGoogle();
      setUser(loggedUser);
      const fullProfile = authService.getUserProfile(loggedUser.id);
      setProfile(fullProfile);
      trackAuth("login");
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password, phone = "") => {
    setLoading(true);
    try {
      const signedUser = await authService.signup(name, email, password, phone);
      setUser(signedUser);
      const fullProfile = authService.getUserProfile(signedUser.id);
      setProfile(fullProfile);
      trackAuth("signup");
      return signedUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout API call failed:", err);
    }
    trackAuth("logout");
    clearAuthSession();
    setLoading(false);
  };

  const updateProfile = async (data) => {
    if (!user) return;
    const updatedProfile = await authService.updateProfile(user.id, data);
    setProfile(updatedProfile);
    
    // Update session user basic details
    const activeUser = authService.getCurrentUser();
    setUser(activeUser);
    return updatedProfile;
  };

  const saveAddress = async (address) => {
    if (!user) return;
    const updatedProfile = await authService.saveAddress(user.id, address);
    setProfile(updatedProfile);
    return updatedProfile.addresses;
  };

  const deleteAddress = async (addressId) => {
    if (!user) return;
    const updatedProfile = await authService.deleteAddress(user.id, addressId);
    setProfile(updatedProfile);
    return updatedProfile.addresses;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: user?.role === "admin",
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        signup,
        logout,
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
