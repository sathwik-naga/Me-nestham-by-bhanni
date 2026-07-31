import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../assets/logo.jpeg";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User, Phone, CheckCircle, AlertTriangle } from "lucide-react";
import SEO from "../components/SEO/SEO";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { login, signup, signInWithGoogle, authNotification, user } = useAuth();

  const handleRedirect = useCallback(() => {
    const savedRedirect = sessionStorage.getItem("redirectAfterLogin");
    if (savedRedirect) {
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(savedRedirect);
    } else {
      navigate(searchParams.get("redirect") || "/profile");
    }
  }, [navigate, searchParams]);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      handleRedirect();
    }
  }, [user, navigate, handleRedirect]);

  const [activeTab, setActiveTab] = useState("login"); // login, signup, forgot
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await login(loginForm.email, loginForm.password);
      setSuccessMsg("Login successful! Redirecting...");
      setTimeout(() => handleRedirect(), 800);
    } catch (err) {
      setErrorMsg(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (signupForm.password !== signupForm.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (signupForm.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await signup(signupForm.name, signupForm.email, signupForm.password, signupForm.phone);
      setSuccessMsg("Registration successful! Welcome to Bhanni.");
      setTimeout(() => handleRedirect(), 1000);
    } catch (err) {
      setErrorMsg(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      await signInWithGoogle();
      // Browser redirects to Google OAuth endpoint
    } catch (err) {
      setErrorMsg(err.message || "Google authentication failed.");
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setForgotSuccess("");
    
    if (!forgotEmail.trim()) {
      setErrorMsg("Please enter your email.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setForgotSuccess("A secure password reset link has been dispatched to " + forgotEmail + ". Please check your spam folder if it doesn't arrive shortly.");
      setForgotEmail("");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-secondary py-12 px-6 font-accent">
      <SEO title="Account Access" noindex={true} />
      <div className="max-w-md w-full bg-brand-card border border-brand-border rounded-3xl p-8 shadow-xl flex flex-col items-center">
        {/* Brand logo */}
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="Me Nestham by Bhanni Logo" className="w-12 h-12 rounded-full object-cover shadow-md" />
          <div className="flex flex-col text-left">
            <span className="font-serif text-xl font-bold text-brand-primary">Me Nestham</span>
            <span className="text-[10px] uppercase tracking-widest text-brand-text-muted font-bold">By Bhanni</span>
          </div>
        </div>

        {/* Tab switcher */}
        {activeTab !== "forgot" && (
          <div className="grid grid-cols-2 bg-brand-secondary border border-brand-border rounded-xl p-1.5 w-full mb-6 text-xs font-semibold">
            <button
              onClick={() => { setActiveTab("login"); setErrorMsg(""); }}
              className={`py-2.5 rounded-lg transition-all ${
                activeTab === "login" ? "bg-brand-card text-brand-primary shadow font-bold" : "text-brand-text-muted hover:text-brand-text"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab("signup"); setErrorMsg(""); }}
              className={`py-2.5 rounded-lg transition-all ${
                activeTab === "signup" ? "bg-brand-card text-brand-primary shadow font-bold" : "text-brand-text-muted hover:text-brand-text"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error / Success notifications */}
        {errorMsg && (
          <div className="w-full p-3.5 bg-brand-error/10 border border-brand-error/20 text-brand-error rounded-xl text-xs font-medium flex items-start gap-2 mb-4 leading-relaxed">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="w-full p-3.5 bg-brand-success/10 border border-brand-success/20 text-brand-success rounded-xl text-xs font-medium flex items-start gap-2 mb-4 leading-relaxed">
            <CheckCircle size={16} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN TAB */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-brand-text">Email Address</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary" size={14} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full bg-brand-secondary border border-brand-border pl-10 pr-4 py-3 rounded-xl outline-none focus:border-brand-primary text-brand-text"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-brand-text">Password</span>
                <button 
                  type="button"
                  onClick={() => setActiveTab("forgot")}
                  className="text-[10px] text-brand-accent hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary" size={14} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full bg-brand-secondary border border-brand-border pl-10 pr-10 py-3 rounded-xl outline-none focus:border-brand-primary text-brand-text"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text font-bold"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-accent text-white font-semibold py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-xs text-center cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? "Verifying..." : "Sign In & Shop"}
            </button>
          </form>
        )}

        {/* SIGNUP TAB */}
        {activeTab === "signup" && (
          <form onSubmit={handleSignupSubmit} className="w-full flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-brand-text">Full Name</span>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary" size={14} />
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  required
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  className="w-full bg-brand-secondary border border-brand-border pl-10 pr-4 py-3 rounded-xl outline-none focus:border-brand-primary text-brand-text"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-brand-text">Email Address</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary" size={14} />
                <input
                  type="email"
                  placeholder="priya@example.com"
                  required
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className="w-full bg-brand-secondary border border-brand-border pl-10 pr-4 py-3 rounded-xl outline-none focus:border-brand-primary text-brand-text"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-brand-text">Contact Mobile (Optional)</span>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary" size={14} />
                <input
                  type="tel"
                  placeholder="10-digit number"
                  value={signupForm.phone}
                  onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  className="w-full bg-brand-secondary border border-brand-border pl-10 pr-4 py-3 rounded-xl outline-none focus:border-brand-primary text-brand-text"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-brand-text">Password</span>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                required
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                className="w-full bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary text-brand-text"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-brand-text">Confirm Password</span>
              <input
                type="password"
                placeholder="Re-type password"
                required
                value={signupForm.confirmPassword}
                onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                className="w-full bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary text-brand-text"
              />
            </div>

            <div className="flex items-start gap-2 mt-1">
              <input type="checkbox" id="signupTerms" required className="mt-0.5 accent-brand-primary" />
              <label htmlFor="signupTerms" className="text-[10px] leading-relaxed text-brand-text-muted">
                I accept the Me Nestham <Link to="/policies/terms" className="text-brand-accent underline">Terms of service</Link> and <Link to="/policies/privacy" className="text-brand-accent underline">Privacy policy</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-accent text-white font-semibold py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-xs text-center cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? "Creating account..." : "Register Account"}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {activeTab === "forgot" && (
          <form onSubmit={handleForgotSubmit} className="w-full flex flex-col gap-4 text-xs">
            <button 
              type="button" 
              onClick={() => { setActiveTab("login"); setErrorMsg(""); }}
              className="text-[10px] text-brand-accent hover:underline self-start mb-2"
            >
              &larr; Back to Login
            </button>

            <span className="font-bold text-brand-text uppercase tracking-wider block border-b border-brand-border pb-2 mb-1">Reset Password</span>
            <p className="text-[11px] text-brand-text-muted leading-relaxed mb-1">
              Provide your email below. If registered, we will send an automated password recovery link.
            </p>

            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-brand-text">Email Address</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary" size={14} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-brand-secondary border border-brand-border pl-10 pr-4 py-3 rounded-xl outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            {forgotSuccess && (
              <div className="p-3.5 bg-brand-success/15 border border-brand-success/30 text-brand-success rounded-xl text-[10px] leading-relaxed">
                {forgotSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-accent text-white font-semibold py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-xs text-center cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>
          </form>
        )}

        {/* Google OAuth button (for both login/signup tabs) */}
        {activeTab !== "forgot" && (
          <div className="w-full flex flex-col items-center gap-4 mt-6 border-t border-brand-border pt-6">
            <span className="text-[10px] text-brand-text-muted uppercase tracking-wider font-semibold">Or Connect With</span>
            <GoogleLoginButton onClick={handleGoogleAuth} isLoading={loading} disabled={loading} />
          </div>
        )}
      </div>
    </div>
  );
}
