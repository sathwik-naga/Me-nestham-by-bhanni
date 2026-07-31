import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.jpeg";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-bg text-brand-text">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping"></div>
            <img src={logo} alt="Me Nestham by Bhanni Logo" className="w-16 h-16 rounded-full object-cover shadow-lg relative z-10" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
            <span className="text-xs font-bold tracking-wide text-brand-primary uppercase">Me Nestham by Bhanni</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login while preserving the current route/query parameters
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (adminOnly && !isAdmin) {
    // Redirect non-admins to the homepage
    return <Navigate to="/" replace />;
  }

  return children;
}
