import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import logo from "../assets/logo.jpeg";
import { Lock, ArrowLeft, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Parse recovery tokens from URL hash fragment
    const hash = location.hash || window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      if (accessToken) {
        localStorage.setItem("access_token", accessToken);
      } else {
        setError("Invalid recovery link. Please request a new one.");
      }
    } else {
      // Check if we already have a session token stored
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("Password reset session expired or missing. Please request a new recovery email.");
      }
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.post("/auth/reset-password", { password });
      setSuccess(true);
      
      // Clean up token to terminate recovery session
      localStorage.removeItem("access_token");
      localStorage.removeItem("mn_current_user");

      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-secondary/35 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-card w-full max-w-md border border-brand-border rounded-3xl p-8 shadow-2xl flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="Me Nestham by Bhanni Logo" className="w-12 h-12 rounded-full object-cover shadow-md mb-2" />
          <h2 className="font-serif font-bold text-2xl text-brand-text">Set New Password</h2>
          <p className="text-xs text-brand-text-muted">
            Please enter your new password below.
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 dark:bg-green-950/20 border border-brand-success/20 p-5 rounded-2xl flex flex-col gap-3 text-center items-center">
            <CheckCircle className="text-brand-success w-10 h-10 animate-bounce" />
            <p className="text-xs font-semibold text-brand-text">
              Password Reset Successful!
            </p>
            <p className="text-[10px] text-brand-text-muted">
              Redirecting you to the sign-in page in a few seconds...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-brand-error/20 p-3.5 rounded-xl text-brand-error text-xs font-semibold flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5 text-xs text-brand-text-muted">
              <span className="font-semibold text-brand-text">New Password</span>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-brand-text-muted" size={14} />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-brand-secondary dark:bg-brand-card border border-brand-border w-full py-3 pl-11 pr-4 rounded-xl outline-none text-xs text-brand-text"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-brand-text-muted">
              <span className="font-semibold text-brand-text">Confirm Password</span>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-brand-text-muted" size={14} />
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-brand-secondary dark:bg-brand-card border border-brand-border w-full py-3 pl-11 pr-4 rounded-xl outline-none text-xs text-brand-text"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!(location.hash === "" && !localStorage.getItem("access_token"))}
              className="bg-brand-primary hover:bg-brand-accent text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>

            <Link
              to="/auth"
              className="text-xs text-brand-accent hover:underline flex items-center justify-center gap-1.5 mt-2 font-bold"
            >
              <ArrowLeft size={12} /> Cancel & Sign In
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
}
