import React from "react";

export default function CheckoutSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent animate-pulse">
      <div className="h-10 bg-brand-secondary/80 rounded-2xl max-w-md mx-auto mb-10" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 bg-brand-secondary/60 rounded-3xl" />
        <div className="h-80 bg-brand-secondary/60 rounded-3xl" />
      </div>
    </div>
  );
}
