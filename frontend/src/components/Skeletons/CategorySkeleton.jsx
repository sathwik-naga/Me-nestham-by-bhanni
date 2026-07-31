import React from "react";

export default function CategorySkeleton() {
  return (
    <div className="h-96 rounded-3xl overflow-hidden bg-brand-secondary/60 animate-pulse p-8 flex flex-col justify-end gap-3">
      <div className="h-4 bg-brand-secondary/90 rounded w-24" />
      <div className="h-8 bg-brand-secondary/90 rounded w-1/2" />
      <div className="h-3 bg-brand-secondary/90 rounded w-3/4" />
    </div>
  );
}
