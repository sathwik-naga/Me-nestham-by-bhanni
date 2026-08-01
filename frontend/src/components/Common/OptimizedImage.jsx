import React, { useState } from 'react';

/**
 * Enterprise Optimized Image Component
 * Features: Supabase Storage Transformation API (WebP/AVIF), Aspect-Ratio preservation,
 * Blur-Up low-res placeholder, and native lazy loading.
 */
export default function OptimizedImage({
  src,
  alt = '',
  width = 600,
  height = 600,
  className = '',
  aspectRatio = 'aspect-square',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Helper to generate Supabase Storage transformed image URL
  const getTransformedUrl = (originalUrl, targetWidth, targetFormat) => {
    if (!originalUrl) return '/placeholder.png';
    if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) return originalUrl;

    // Check if it's a Supabase storage URL
    if (originalUrl.includes('supabase.co/storage/v1/object/public/')) {
      const transformUrl = originalUrl.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/'
      );
      const urlObj = new URL(transformUrl);
      urlObj.searchParams.set('width', targetWidth.toString());
      urlObj.searchParams.set('quality', '80');
      if (targetFormat) urlObj.searchParams.set('format', targetFormat);
      return urlObj.toString();
    }

    return originalUrl;
  };

  const avifSrc = getTransformedUrl(src, width, 'avif');
  const webpSrc = getTransformedUrl(src, width, 'webp');
  const defaultSrc = getTransformedUrl(src, width);

  return (
    <div className={`relative overflow-hidden bg-brand-secondary/40 ${aspectRatio} ${className}`}>
      {/* Aspect-Ratio Low-Res Blur Placeholder */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-brand-secondary/80 animate-pulse backdrop-blur-md transition-opacity duration-500"
          style={{ width: '100%', height: '100%' }}
        />
      )}

      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-secondary text-brand-text-muted text-xs font-semibold">
          <span>Image Unavailable</span>
        </div>
      ) : (
        <picture>
          {/* AVIF Next-Gen Source */}
          <source type="image/avif" srcSet={avifSrc} sizes={sizes} />
          
          {/* WebP Next-Gen Source */}
          <source type="image/webp" srcSet={webpSrc} sizes={sizes} />

          {/* Standard Fallback Image */}
          <img
            src={defaultSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm'
            }`}
          />
        </picture>
      )}
    </div>
  );
}
