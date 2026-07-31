import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpeg";
import { Loader2, AlertCircle } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { syncUserProfile, setAuthNotification } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let isSubscribed = true;

    async function handleAuthCallback() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!session?.user) {
          throw new Error("Authentication failed or session was not retrieved.");
        }

        // Execute atomic profile sync
        await syncUserProfile(session.user, session.user.app_metadata?.provider || "google");

        if (!isSubscribed) return;

        // Smart Redirect Waterfall Engine:
        // Priority 1: redirect query param
        const queryRedirect = searchParams.get("redirect");
        // Priority 2: sessionStorage stored destination
        const storedRedirect = sessionStorage.getItem("redirectAfterLogin");
        if (storedRedirect) sessionStorage.removeItem("redirectAfterLogin");

        // Priority 3: Referrer if internal domain
        let referrerRedirect = null;
        if (document.referrer && document.referrer.includes(window.location.host)) {
          try {
            const url = new URL(document.referrer);
            if (url.pathname !== "/auth" && url.pathname !== "/auth/callback") {
              referrerRedirect = url.pathname + url.search;
            }
          } catch (e) {
            // ignore invalid URL
          }
        }

        const targetRoute = queryRedirect || storedRedirect || referrerRedirect || "/";
        navigate(targetRoute, { replace: true });
      } catch (err) {
        console.error("Error during OAuth callback processing:", err);
        if (isSubscribed) {
          const message = err?.message || "Google Authentication failed. Please try again.";
          setErrorMsg(message);
          setAuthNotification?.({ type: "error", message });
          setTimeout(() => {
            navigate("/auth", { replace: true });
          }, 2000);
        }
      }
    }

    handleAuthCallback();

    return () => {
      isSubscribed = false;
    };
  }, [navigate, searchParams, syncUserProfile, setAuthNotification]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg text-brand-text px-6 font-accent">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping"></div>
          <img src={logo} alt="Me Nestham by Bhanni" className="w-20 h-20 rounded-full object-cover shadow-xl relative z-10" />
        </div>

        {errorMsg ? (
          <div className="flex flex-col items-center gap-3 text-red-500 bg-red-50 dark:bg-red-950/40 p-4 rounded-2xl border border-red-200 dark:border-red-800">
            <AlertCircle size={24} />
            <p className="text-xs font-semibold">{errorMsg}</p>
            <span className="text-[11px] text-gray-500">Redirecting back to login...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-brand-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">Completing Authentication</span>
            </div>
            <p className="text-xs text-brand-text-muted">Setting up your profile and restoring your session...</p>
          </div>
        )}
      </div>
    </div>
  );
}
