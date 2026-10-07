import React, { useState, useEffect } from "react";

/**
 * High-performance Optimized Image component
 * - Resets loading & error state whenever `src` prop changes (no state leaks across products/categories)
 * - Uses key={currentSrc} to guarantee clean DOM element binding
 * - Zero CLS with aspect-ratio container
 * - Smooth fade-in on load
 * - Lightweight shimmer loading placeholder
 * - Native priority loading for above-the-fold images
 * - Native lazy loading and async decoding for below-the-fold
 * - Graceful fallback on network error (never displays broken image icon or naked browser alt text)
 */
export default function OptimizedImage({
  src,
  fallbackSrc = "/placeholder.png",
  alt = "",
  className = "",
  containerClassName = "",
  width,
  height,
  priority = false,
  aspectRatio = "16 / 10",
  objectFit = "cover",
  ...props
}) {
  const initialSrc = src || fallbackSrc || "/placeholder.png";
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Synchronize internal state whenever src or fallbackSrc changes
  useEffect(() => {
    setCurrentSrc(src || fallbackSrc || "/placeholder.png");
    setIsLoaded(false);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setIsLoaded(false);
      setHasError(false);
    } else if (currentSrc !== "/placeholder.png") {
      setCurrentSrc("/placeholder.png");
      setIsLoaded(false);
      setHasError(false);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-brand-secondary/40 ${containerClassName}`}
      style={{ aspectRatio }}
    >
      {/* Lightweight Shimmer Skeleton Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-800/40 via-neutral-700/50 to-neutral-800/40 animate-pulse pointer-events-none" />
      )}

      {/* Fallback container if image fails completely (never show broken image icon or browser alt text in empty box) */}
      {hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-brand-secondary/70 text-brand-text-muted p-4 select-none">
          <svg
            className="w-10 h-10 mb-1 opacity-40 text-brand-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-[10px] font-semibold text-brand-text-muted uppercase tracking-wider">
            Me Nestham
          </span>
        </div>
      ) : (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={`w-full h-full object-${objectFit} transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
}
