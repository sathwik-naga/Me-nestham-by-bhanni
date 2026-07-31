/**
 * Generate optimized image attributes for responsive WebP/AVIF images
 */
export function getOptimizedImageUrl(url, width = 600) {
  if (!url || typeof url !== "string") return "/placeholder.png";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  
  // If Supabase Storage image, append width and format query params
  if (url.includes("supabase.co/storage")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}width=${width}&format=webp&quality=80`;
  }

  return url;
}

/**
 * Generate standard HTML image attributes (srcset, sizes, loading, decoding, width, height)
 */
export function getResponsiveImageProps({
  src,
  alt = "Product Image",
  width = 600,
  height = 600,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
}) {
  const defaultSrc = getOptimizedImageUrl(src, width);

  let srcset = "";
  if (src && src.includes("supabase.co/storage")) {
    srcset = [
      `${getOptimizedImageUrl(src, 300)} 300w`,
      `${getOptimizedImageUrl(src, 600)} 600w`,
      `${getOptimizedImageUrl(src, 900)} 900w`,
    ].join(", ");
  }

  return {
    src: defaultSrc,
    alt,
    width,
    height,
    loading: priority ? "eager" : "lazy",
    decoding: "async",
    ...(srcset ? { srcSet: srcset, sizes } : {}),
  };
}
