import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.jpeg";
import { Send, Instagram, Facebook, Youtube, ShieldCheck } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-brand-secondary border-t border-brand-border mt-auto pt-16 pb-8 font-accent">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
        
        {/* Brand Narrative Column */}
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img src={logo} alt="Me Nestham by Bhanni Logo" className="w-9 h-9 rounded-full object-cover shadow-sm" />
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-brand-primary">Me Nestham</span>
              <span className="text-[9px] uppercase tracking-widest text-brand-text-muted font-bold">By Bhanni</span>
            </div>
          </Link>
          <p className="text-xs text-brand-text-muted leading-relaxed max-w-sm mb-6">
            Me Nestham by Bhanni is your premium destination for garland raw materials, artificial flower petals, decoration supplies, wedding accessories and craft materials.
          </p>
          <div className="flex items-center gap-4 text-brand-text-muted">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-brand-primary transition-colors" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-brand-primary transition-colors" aria-label="Facebook">
              <Facebook size={18} />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-brand-primary transition-colors" aria-label="YouTube">
              <Youtube size={18} />
            </a>
          </div>
        </div>

        {/* Column 1: Links */}
        <div>
          <h4 className="font-serif text-sm font-bold text-brand-primary mb-5">Quick Shop</h4>
          <ul className="flex flex-col gap-3 text-xs text-brand-text hover:text-brand-primary transition-colors">
            <li><Link to="/shop" className="hover:text-brand-primary hover:underline">All Collections</Link></li>
            <li><Link to="/categories/foam-flowers" className="hover:text-brand-primary hover:underline">Foam Flowers</Link></li>
            <li><Link to="/categories/artificial-flowers" className="hover:text-brand-primary hover:underline">Artificial Flowers</Link></li>
            <li><Link to="/categories/decorative-balls" className="hover:text-brand-primary hover:underline">Decorative Balls</Link></li>
            <li><Link to="/categories/bells" className="hover:text-brand-primary hover:underline">Filigree Bells</Link></li>
            <li><Link to="/categories/beads" className="hover:text-brand-primary hover:underline">Garland Beads</Link></li>
            <li><Link to="/categories/decorative-items" className="hover:text-brand-primary hover:underline">Decorative Items</Link></li>
          </ul>
        </div>

        {/* Column 2: Support Links */}
        <div>
          <h4 className="font-serif text-sm font-bold text-brand-primary mb-5">Customer Support</h4>
          <ul className="flex flex-col gap-3 text-xs">
            <li><Link to="/contact" className="hover:text-brand-primary hover:underline">Contact Support</Link></li>
            <li><Link to="/faq" className="hover:text-brand-primary hover:underline">FAQ Help Center</Link></li>
            <li><Link to="/profile?tab=orders" className="hover:text-brand-primary hover:underline">Order Tracking</Link></li>
            <li><Link to="/policies/shipping" className="hover:text-brand-primary hover:underline">Shipping Policy</Link></li>
          </ul>
        </div>

        {/* Column 3: Newsletter Email capture */}
        <div>
          <h4 className="font-serif text-sm font-bold text-brand-primary mb-3">Newsletter</h4>
          <p className="text-xs text-brand-text-muted mb-4 leading-relaxed">
            Subscribe to receive styling guides, artisan backstories, and exclusive coupons.
          </p>
          <form onSubmit={handleSubscribe} className="relative mb-3">
            <input
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-bg text-brand-text border border-brand-border px-4 py-3 rounded-lg outline-none focus:border-brand-primary text-xs pr-10"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 p-1.5 bg-brand-primary hover:bg-brand-accent text-white rounded-md transition-colors"
              aria-label="Subscribe"
            >
              <Send size={14} />
            </button>
          </form>
          {subscribed && (
            <p className="text-[10px] text-brand-success font-semibold flex items-center gap-1">
              <ShieldCheck size={12} /> Thank you for subscribing! Check your inbox for 10% off code.
            </p>
          )}
        </div>
      </div>

      {/* Bottom Bar: Copyright, Payment badges, policies */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 border-t border-brand-border pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] text-brand-text-muted">
        <div>
          © 2026 Me Nestham By Bhanni. All Rights Reserved. Created with artisan pride.
        </div>
        
        {/* Policy Quick Links */}
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link to="/policies/privacy" className="hover:underline">Privacy Policy</Link>
          <span>|</span>
          <Link to="/policies/terms" className="hover:underline">Terms &amp; Conditions</Link>
          <span>|</span>
          <Link to="/policies/shipping" className="hover:underline">Shipping</Link>
        </div>

        {/* Payment logos */}
        <div className="flex items-center gap-3">
          <span className="text-[9px] uppercase tracking-wider font-semibold text-brand-text-muted">Secured via Razorpay:</span>
          <div className="flex gap-2 items-center opacity-70">
            <span className="border border-brand-border rounded px-1 py-0.5 bg-brand-bg font-bold font-mono tracking-tight text-[9px]">UPI</span>
            <span className="border border-brand-border rounded px-1 py-0.5 bg-brand-bg font-bold text-[9px] italic">VISA</span>
            <span className="border border-brand-border rounded px-1 py-0.5 bg-brand-bg font-bold text-[9px] italic">MC</span>
            <span className="border border-brand-border rounded px-1 py-0.5 bg-brand-bg font-bold text-[9px] font-sans">RuPay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
