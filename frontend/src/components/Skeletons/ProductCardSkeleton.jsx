import React from "react";

export default function ProductCardSkeleton() {
  return (
    <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-sm animate-pulse flex flex-col">
      <div className="aspect-square bg-brand-secondary/60 w-full" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-3 bg-brand-secondary/80 rounded w-1/3" />
        <div className="h-4 bg-brand-secondary/80 rounded w-3/4" />
        <div className="h-3 bg-brand-secondary/80 rounded w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 bg-brand-secondary/80 rounded w-1/4" />
          <div className="h-8 w-8 bg-brand-secondary/80 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
