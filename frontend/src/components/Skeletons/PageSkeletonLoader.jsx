import React from "react";

export default function PageSkeletonLoader() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 font-accent animate-pulse">
      <div className="w-12 h-12 rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin mb-4" />
      <div className="h-4 bg-brand-secondary/80 rounded w-48 mb-2" />
      <div className="h-3 bg-brand-secondary/60 rounded w-32" />
    </div>
  );
}
