import React from "react";

export default function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent animate-pulse">
      <div className="h-3 bg-brand-secondary/60 rounded w-48 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="aspect-square bg-brand-secondary/60 rounded-3xl w-full" />
        <div className="flex flex-col gap-5">
          <div className="h-4 bg-brand-secondary/80 rounded w-28" />
          <div className="h-8 bg-brand-secondary/80 rounded w-3/4" />
          <div className="h-6 bg-brand-secondary/80 rounded w-1/3" />
          <div className="h-16 bg-brand-secondary/60 rounded-2xl w-full" />
          <div className="h-12 bg-brand-secondary/80 rounded-2xl w-full" />
        </div>
      </div>
    </div>
  );
}
