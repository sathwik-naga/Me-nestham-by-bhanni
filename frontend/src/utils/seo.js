export const SITE_URL = import.meta.env.VITE_SITE_URL || "https://www.menesthambybhanni.com";
export const SITE_NAME = import.meta.env.VITE_SITE_NAME || "Me Nestham by Bhanni";
export const DEFAULT_DESCRIPTION = import.meta.env.VITE_SITE_DESCRIPTION || "Premium Garland Making Materials, Artificial Flower Petals, Decoration Supplies & Craft Materials Online.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/thumbnail.png`;

/**
 * Generate full canonical URL for any route path
 */
export function generateCanonicalUrl(path = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Generate Organization JSON-LD Schema
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "alternateName": "Bhanni Handcrafted Goods",
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo.jpeg`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9949345197",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["English", "Telugu", "Hindi"]
    },
    "email": "funnycolours123@gmail.com",
    "sameAs": [
      "https://wa.me/919949345197"
    ]
  };
}

/**
 * Generate WebSite JSON-LD Schema with SearchAction
 */
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/shop?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Generate Product JSON-LD Schema with Offer and Rating
 */
export function generateProductSchema(product) {
  if (!product) return null;

  const price = product.price || (product.variants && product.variants[0]?.price) || 0;
  const inStock = (product.stockCount ?? (product.variants && product.variants[0]?.stock) ?? 1) > 0;
  const image = product.featured_image || product.image || (product.images && product.images[0]) || DEFAULT_OG_IMAGE;
  const absoluteImage = image.startsWith("http") ? image : `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": [absoluteImage],
    "description": product.description || `Buy ${product.name} online at Me Nestham by Bhanni.`,
    "sku": product.id || product.slug,
    "brand": {
      "@type": "Brand",
      "name": SITE_NAME
    },
    "offers": {
      "@type": "Offer",
      "url": `${SITE_URL}/products/${product.slug || product.id}`,
      "priceCurrency": "INR",
      "price": String(price),
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": SITE_NAME
      }
    }
  };

  // Add aggregateRating only if valid ratings/reviews exist
  if (product.rating && product.reviewCount && Number(product.reviewCount) > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": String(product.rating),
      "reviewCount": String(product.reviewCount)
    };
  } else if (product.reviews && Array.isArray(product.reviews) && product.reviews.length > 0) {
    const avgRating = (product.reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / product.reviews.length).toFixed(1);
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": String(avgRating),
      "reviewCount": String(product.reviews.length)
    };
  }

  return schema;
}

/**
 * Generate CollectionPage (Category) JSON-LD Schema
 */
export function generateCollectionPageSchema(category, productCount = 0) {
  if (!category) return null;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.name,
    "description": category.description || `Explore ${category.name} collection at Me Nestham by Bhanni.`,
    "url": `${SITE_URL}/categories/${category.slug}`,
    "numberOfItems": productCount
  };
}

/**
 * Generate BreadcrumbList JSON-LD Schema
 */
export function generateBreadcrumbSchema(items = []) {
  const itemListElement = items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url.startsWith("/") ? "" : "/"}${item.url}`
  }));

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": itemListElement
  };
}

/**
 * Generate FAQPage JSON-LD Schema
 */
export function generateFaqSchema(faqs = []) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q || faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a || faq.answer
      }
    }))
  };
}
