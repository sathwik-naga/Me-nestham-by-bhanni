import React from "react";

export default function CartSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent animate-pulse flex flex-col gap-6">
      <div className="h-8 bg-brand-secondary/80 rounded w-48 mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-brand-secondary/60 rounded-2xl w-full" />
          ))}
        </div>
        <div className="h-64 bg-brand-secondary/60 rounded-3xl w-full" />
      </div>
    </div>
  );
}
