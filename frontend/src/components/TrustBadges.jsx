import React from "react";
import { ShieldCheck, Sparkles, Truck, RefreshCcw } from "lucide-react";

export default function TrustBadges() {
  const badges = [
    {
      icon: <Sparkles className="text-brand-primary" size={26} />,
      title: "100% Handcrafted Authenticity",
      desc: "Procured directly from rural weavers & certified heritage artisans."
    },
    {
      icon: <ShieldCheck className="text-brand-primary" size={26} />,
      title: "Secure Encrypted Checkout",
      desc: "Compliant Razorpay-powered online transaction gateway."
    },
    {
      icon: <Truck className="text-brand-primary" size={26} />,
      title: "Reliable Nationwide Delivery",
      desc: "Fast dispatch and real-time package fulfillment tracking."
    },
    {
      icon: <RefreshCcw className="text-brand-primary" size={26} />,
      title: "Hassle-Free 7-Day Returns",
      desc: "Easy reverse pickup scheduling and quick refunds."
    }
  ];

  return (
    <div className="bg-brand-secondary dark:bg-[#201D1B] border-y border-brand-border py-12 px-6 font-accent">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {badges.map((badge, idx) => (
          <div 
            key={idx} 
            className="flex items-start gap-4 p-4 rounded-2xl bg-brand-bg dark:bg-[#1A1714] border border-brand-border/60 hover:border-brand-primary hover:shadow-md transition-all duration-300"
          >
            <div className="p-3 bg-brand-secondary dark:bg-[#2D2723] rounded-xl shrink-0">
              {badge.icon}
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-brand-text mb-1 leading-snug">
                {badge.title}
              </h4>
              <p className="text-[11px] text-brand-text-muted leading-relaxed">
                {badge.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
