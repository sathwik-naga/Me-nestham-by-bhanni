import React, { useState, useEffect } from "react";
import { Shield, Cookie, X, Check, Settings } from "lucide-react";
import { getStoredConsent, saveConsent } from "../services/analytics/analytics";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [customAnalytics, setCustomAnalytics] = useState(true);
  const [customMarketing, setCustomMarketing] = useState(true);

  useEffect(() => {
    const existing = getStoredConsent();
    if (!existing) {
      // Show banner if no consent choice saved yet
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => {
    saveConsent({ analytics: true, marketing: true });
    setVisible(false);
  };

  const handleRejectNonEssential = () => {
    saveConsent({ analytics: false, marketing: false });
    setVisible(false);
  };

  const handleSaveCustom = () => {
    saveConsent({ analytics: customAnalytics, marketing: customMarketing });
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 font-accent text-left">
      <div className="bg-brand-card border border-brand-border rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col gap-4 text-brand-text">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
              <Cookie size={20} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-brand-text">Cookie & Privacy Choices</h4>
              <span className="text-[10px] text-brand-text-muted">We respect your privacy data rights</span>
            </div>
          </div>
          <button
            onClick={handleRejectNonEssential}
            className="p-1 text-brand-text-muted hover:text-brand-text rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-brand-text-muted leading-relaxed">
          We use cookies and analytics to measure site traffic, optimize your shopping experience, and deliver relevant marketing content.
        </p>

        {!showCustomize ? (
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              onClick={handleAcceptAll}
              className="w-full sm:w-auto flex-1 bg-brand-primary hover:bg-brand-accent text-white py-2.5 px-4 rounded-xl text-xs font-semibold shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check size={14} /> Accept All
            </button>
            <button
              onClick={handleRejectNonEssential}
              className="w-full sm:w-auto bg-brand-secondary border border-brand-border text-brand-text hover:bg-brand-card py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Reject Non-Essential
            </button>
            <button
              onClick={() => setShowCustomize(true)}
              className="p-2.5 text-brand-text-muted hover:text-brand-primary border border-brand-border rounded-xl transition-colors cursor-pointer"
              title="Customize Preferences"
            >
              <Settings size={15} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-2 border-t border-brand-border">
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <div>
                <span className="font-bold block text-brand-text">Essential Cookies</span>
                <span className="text-[10px] text-brand-text-muted">Required for cart, auth &amp; checkout</span>
              </div>
              <input type="checkbox" checked disabled className="rounded text-brand-primary" />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer">
              <div>
                <span className="font-bold block text-brand-text">Analytics Cookies</span>
                <span className="text-[10px] text-brand-text-muted">Anonymous usage &amp; traffic statistics</span>
              </div>
              <input
                type="checkbox"
                checked={customAnalytics}
                onChange={(e) => setCustomAnalytics(e.target.checked)}
                className="rounded text-brand-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer">
              <div>
                <span className="font-bold block text-brand-text">Marketing Cookies</span>
                <span className="text-[10px] text-brand-text-muted">Tailored ad suggestions &amp; social pixels</span>
              </div>
              <input
                type="checkbox"
                checked={customMarketing}
                onChange={(e) => setCustomMarketing(e.target.checked)}
                className="rounded text-brand-primary cursor-pointer"
              />
            </label>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveCustom}
                className="flex-1 bg-brand-primary hover:bg-brand-accent text-white py-2 px-4 rounded-xl text-xs font-semibold shadow transition-all cursor-pointer"
              >
                Save Preferences
              </button>
              <button
                onClick={() => setShowCustomize(false)}
                className="bg-brand-secondary border border-brand-border text-brand-text py-2 px-3 rounded-xl text-xs font-semibold hover:bg-brand-card cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
