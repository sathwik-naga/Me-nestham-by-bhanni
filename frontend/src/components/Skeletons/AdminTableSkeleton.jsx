import React from "react";

export default function AdminTableSkeleton({ rows = 5 }) {
  return (
    <div className="w-full bg-brand-card border border-brand-border rounded-3xl overflow-hidden animate-pulse p-6">
      <div className="h-6 bg-brand-secondary/80 rounded w-1/4 mb-6" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-12 bg-brand-secondary/50 rounded-xl w-full" />
        ))}
      </div>
    </div>
  );
}
