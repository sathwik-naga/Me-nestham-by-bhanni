import React, { useState } from "react";
import { api } from "../services/api";
import logo from "../assets/logo.jpeg";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
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
          <h2 className="font-serif font-bold text-2xl text-brand-text">Recover Password</h2>
          <p className="text-xs text-brand-text-muted">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {message ? (
          <div className="bg-green-50 dark:bg-green-950/20 border border-brand-success/20 p-5 rounded-2xl flex flex-col gap-3 text-center items-center">
            <CheckCircle className="text-brand-success w-10 h-10" />
            <p className="text-xs font-semibold text-brand-text leading-relaxed">
              {message}
            </p>
            <Link
              to="/auth"
              className="text-xs text-brand-accent hover:underline flex items-center gap-1.5 mt-2 font-bold"
            >
              <ArrowLeft size={12} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-brand-error/20 p-3.5 rounded-xl text-brand-error text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5 text-xs text-brand-text-muted">
              <span className="font-semibold text-brand-text">Email Address</span>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-brand-text-muted" size={14} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-brand-secondary dark:bg-brand-card border border-brand-border w-full py-3 pl-11 pr-4 rounded-xl outline-none text-xs text-brand-text"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-brand-primary hover:bg-brand-accent text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Sending Link...
                </>
              ) : (
                "Send Reset Instructions"
              )}
            </button>

            <Link
              to="/auth"
              className="text-xs text-brand-accent hover:underline flex items-center justify-center gap-1.5 mt-2 font-bold"
            >
              <ArrowLeft size={12} /> Back to Sign In
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
}
