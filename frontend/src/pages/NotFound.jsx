import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, ArrowLeft, AlertCircle } from "lucide-react";
import SEO from "../components/SEO/SEO";

export default function NotFound() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16 font-accent text-center">
      <SEO
        title="Page Not Found (404)"
        description="The page you are looking for does not exist or has been moved."
        noindex={true}
      />

      <div className="max-w-md w-full bg-brand-card border border-brand-border rounded-3xl p-8 shadow-lg flex flex-col items-center gap-6">
        <div className="p-4 bg-brand-secondary rounded-full border border-brand-border text-brand-primary">
          <AlertCircle size={40} />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-primary block mb-2">Error 404</span>
          <h1 className="font-serif text-3xl font-extrabold text-brand-text mb-3">Page Not Found</h1>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        {/* Search bar helper */}
        <form onSubmit={handleSearch} className="w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-secondary border border-brand-border pl-10 pr-4 py-3 rounded-xl text-xs text-brand-text outline-none focus:border-brand-primary"
            />
          </div>
          <button
            type="submit"
            className="bg-brand-primary hover:bg-brand-accent text-white px-4 py-3 rounded-xl text-xs font-semibold shadow transition-all cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
          <Link
            to="/shop"
            className="w-full bg-brand-primary hover:bg-brand-accent text-white py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow cursor-pointer"
          >
            <ShoppingBag size={15} /> Continue Shopping
          </Link>
          <Link
            to="/"
            className="w-full bg-brand-secondary hover:bg-brand-card border border-brand-border text-brand-text py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft size={15} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
