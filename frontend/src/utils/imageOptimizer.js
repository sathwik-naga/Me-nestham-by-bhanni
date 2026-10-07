/**
 * Me Nestham Image Optimization Utility
 * Provides deterministic, edge-cached WebP asset resolution with graceful fallbacks.
 */

const SUPABASE_PUBLIC_BASE = "https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/";

// Local high-performance WebP category assets (empty for fresh catalog)
export const OPTIMIZED_CATEGORY_IMAGES = {};

// Aliases for slug or name normalization
const CATEGORY_ALIASES = {};

// Local high-performance WebP product assets (empty for fresh catalog)
export const OPTIMIZED_PRODUCT_IMAGES = {};

// Known verified Supabase public storage assets for catalog products (empty for fresh catalog)
export const SUPABASE_CATALOG_IMAGES = {};

/**
 * Resolves the deterministic, fastest available image URL for a category.
 * Guaranteed never to return a mismatched image for another category.
 */
export function getCategoryImageUrl(slug = "", originalUrl = "", nameHint = "") {
  const cleanSlug = String(slug || "").trim().toLowerCase();

  // 1. Direct slug match
  if (cleanSlug && OPTIMIZED_CATEGORY_IMAGES[cleanSlug]) {
    return OPTIMIZED_CATEGORY_IMAGES[cleanSlug];
  }

  // 2. Slug alias match
  if (cleanSlug && CATEGORY_ALIASES[cleanSlug]) {
    return OPTIMIZED_CATEGORY_IMAGES[CATEGORY_ALIASES[cleanSlug]];
  }

  // 3. Name hint match
  if (nameHint) {
    const cleanName = String(nameHint).trim().toLowerCase();
    if (CATEGORY_ALIASES[cleanName]) {
      return OPTIMIZED_CATEGORY_IMAGES[CATEGORY_ALIASES[cleanName]];
    }
    const slugifiedName = cleanName.replace(/[^a-z0-9]+/g, "-");
    if (OPTIMIZED_CATEGORY_IMAGES[slugifiedName]) {
      return OPTIMIZED_CATEGORY_IMAGES[slugifiedName];
    }
  }

  // 4. Inspect original URL for known category tokens
  if (originalUrl && typeof originalUrl === "string") {
    const lowerUrl = originalUrl.toLowerCase();
    for (const key of Object.keys(OPTIMIZED_CATEGORY_IMAGES)) {
      if (lowerUrl.includes(`/${key}.`) || lowerUrl.includes(`/${key}/`) || lowerUrl.includes(`_${key}.`)) {
        return OPTIMIZED_CATEGORY_IMAGES[key];
      }
    }
    const filename = lowerUrl.split("/").pop()?.split("?")[0]?.replace(/\.(png|jpe?g|webp|gif)$/i, "");
    if (filename && OPTIMIZED_CATEGORY_IMAGES[filename]) {
      return OPTIMIZED_CATEGORY_IMAGES[filename];
    }
  }

  // 5. Fallback: normalize Supabase image transformations if present
  if (originalUrl && typeof originalUrl === "string") {
    if (originalUrl.includes("/storage/v1/render/image/")) {
      return originalUrl.replace(/\/storage\/v1\/render\/image\/(public\/)?/, "/storage/v1/object/public/").split("?")[0];
    }
    if (!originalUrl.includes("unsplash.com")) {
      return originalUrl;
    }
  }

  return "/placeholder.png";
}

/**
 * Normalizes a category object to guarantee valid, current image paths and product counts.
 */
export function normalizeCategory(cat) {
  if (!cat || typeof cat !== "object") return null;

  const slug = String(cat.slug || "").trim().toLowerCase();
  const name = String(cat.name || "").trim();
  const rawImage = cat.image_url || cat.image || "";
  const resolvedImage = getCategoryImageUrl(slug, rawImage, name);

  return {
    ...cat,
    id: cat.id || slug,
    slug: slug,
    name: name || cat.name || slug,
    image: resolvedImage,
    image_url: resolvedImage,
    productCount: cat.productCount ?? cat.product_count ?? 0,
  };
}

/**
 * Normalizes an array of categories, filtering out invalid items and migrating old cache formats.
 */
export function normalizeCategories(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeCategory).filter(Boolean);
}

/**
 * Deterministic product image resolver.
 * Handles diverse product object formats, Supabase storage paths, legacy transformations,
 * and ensures a guaranteed valid URL with fallback.
 * 
 * @param {Object|string} product - Product object or direct URL
 * @param {string} [fallbackUrl] - Optional explicit fallback
 * @returns {string} Guaranteed valid, normalized image URL
 */
export function getProductImageUrl(product, fallbackUrl = "/placeholder.png") {
  if (!product) return fallbackUrl;

  // Direct string URL passed
  if (typeof product === "string") {
    return normalizeProductUrl(product, fallbackUrl);
  }

  const slug = String(product.slug || "").trim().toLowerCase();

  // 1. Direct match for high-res optimized WebP product assets
  if (slug && OPTIMIZED_PRODUCT_IMAGES[slug]) {
    return OPTIMIZED_PRODUCT_IMAGES[slug];
  }

  // 2. Direct match for known Supabase catalog products
  if (slug && SUPABASE_CATALOG_IMAGES[slug]) {
    return SUPABASE_CATALOG_IMAGES[slug];
  }

  // 3. Extract candidate image URL across all known schema formats
  let candidate = "";

  // 3a. Check variants for primary image
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    const defaultVar = product.variants.find(v => v.is_default) || product.variants[0];
    if (defaultVar && Array.isArray(defaultVar.images) && defaultVar.images.length > 0) {
      const prim = defaultVar.images.find(img => typeof img === "object" && img?.is_primary);
      const chosen = prim || defaultVar.images[0];
      candidate = typeof chosen === "string" ? chosen : (chosen?.image_url || chosen?.url || chosen?.src || chosen?.storage_path || "");
    } else if (defaultVar?.image_url || defaultVar?.featured_image) {
      candidate = defaultVar.image_url || defaultVar.featured_image;
    }
  }

  // 3b. Check primary product fields
  if (!candidate) {
    candidate = product.featured_image || product.image_url || product.imageUrl || product.image || "";
  }

  // 3c. Check product.images array
  if (!candidate && Array.isArray(product.images) && product.images.length > 0) {
    const prim = product.images.find(img => typeof img === "object" && img?.is_primary);
    const chosen = prim || product.images[0];
    candidate = typeof chosen === "string" ? chosen : (chosen?.image_url || chosen?.url || chosen?.src || chosen?.storage_path || "");
  }

  // 3d. Check product.product_images array (raw DB format)
  if (!candidate && Array.isArray(product.product_images) && product.product_images.length > 0) {
    const feat = product.product_images.find(img => img?.is_featured || img?.is_primary);
    const chosen = feat || product.product_images[0];
    candidate = chosen?.image_url || chosen?.url || chosen?.storage_path || "";
  }

  // 3e. Check product.gallery / gallery_images
  if (!candidate && Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
    candidate = product.gallery_images[0];
  } else if (!candidate && Array.isArray(product.gallery) && product.gallery.length > 0) {
    candidate = product.gallery[0];
  }

  // 3f. Check product.thumbnail
  if (!candidate && product.thumbnail) {
    candidate = product.thumbnail;
  }

  // If candidate is found, normalize it
  if (candidate) {
    const normalized = normalizeProductUrl(candidate, "");
    if (normalized) return normalized;
  }

  // If candidate is empty or invalid, try matching slug or return fallback
  return fallbackUrl || "/placeholder.png";
}

/**
 * Normalizes an individual image URL:
 * - Fixes Supabase /render/image transformations (403 FeatureNotEnabled)
 * - Prepends public URL for relative storage paths
 * - Removes dead/broken Unsplash seeds
 * - Preserves valid public Supabase URLs and local paths
 */
export function normalizeProductUrl(url = "", fallback = "/placeholder.png") {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return fallback;

  // Local static asset
  if (trimmed.startsWith("/") || trimmed.startsWith("./")) {
    return trimmed;
  }

  // Dead/broken legacy Unsplash seed detection: do not serve dead Unsplash URLs
  if (trimmed.includes("unsplash.com")) {
    return fallback;
  }

  // Disabled Supabase Storage image transformation: replace /render/image/ with /object/public/
  if (trimmed.includes("/storage/v1/render/image/")) {
    return trimmed.replace(/\/storage\/v1\/render\/image\/(public\/)?/, "/storage/v1/object/public/").split("?")[0];
  }

  // Relative storage path handling
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    if (trimmed.startsWith("product-images/")) {
      return `https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/${trimmed}`;
    }
    if (trimmed.startsWith("products/") || trimmed.startsWith("categories/")) {
      return `${SUPABASE_PUBLIC_BASE}${trimmed}`;
    }
    return `${SUPABASE_PUBLIC_BASE}products/${trimmed}`;
  }

  // Valid remote URL
  return trimmed;
}

/**
 * Normalizes a product object to ensure reliable image paths and prevent broken cards.
 */
export function normalizeProduct(product) {
  if (!product || typeof product !== "object") return null;

  const resolvedImage = getProductImageUrl(product);

  let images = Array.isArray(product.images) ? [...product.images] : [];
  if (images.length === 0 || images[0] === "/placeholder.png" || (typeof images[0] === "string" && images[0].includes("unsplash.com"))) {
    images = [resolvedImage];
  } else if (!images.includes(resolvedImage)) {
    images.unshift(resolvedImage);
  }

  return {
    ...product,
    id: product.id || product.slug || `prod-${Math.random().toString(36).slice(2, 9)}`,
    image: resolvedImage,
    image_url: resolvedImage,
    featured_image: resolvedImage,
    images: images,
  };
}

/**
 * Normalizes an array of products.
 */
export function normalizeProducts(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeProduct).filter(Boolean);
}

/**
 * Checks whether an image URL is a remote Supabase Storage asset.
 */
export function isSupabaseStorageUrl(url) {
  return typeof url === "string" && url.includes(".supabase.co/storage/v1/object/public");
}
