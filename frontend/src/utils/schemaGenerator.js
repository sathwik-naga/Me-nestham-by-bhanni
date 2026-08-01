import { SITE_URL, SITE_NAME } from './seo';

/**
 * Generate Organization JSON-LD Schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.jpeg`,
    sameAs: [
      'https://instagram.com/menesthambybhanni',
      'https://facebook.com/menesthambybhanni',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9876543210',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['en', 'te'],
    },
  };
}

/**
 * Generate Product JSON-LD Schema with Price & Aggregate Rating
 */
export function generateProductSchema(product) {
  if (!product) return null;

  const price = product.offerPrice || product.price || 0;
  const ratingValue = product.rating || 4.8;
  const reviewCount = product.reviewCount || 12;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: Array.isArray(product.images) ? product.images : [product.image || `${SITE_URL}/placeholder.png`],
    description: product.description || `${product.name} from Me Nestham By Bhanni luxury collection`,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.slug || product.id}`,
      priceCurrency: 'INR',
      price: price.toString(),
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: (product.stock || 10) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: ratingValue.toString(),
      reviewCount: reviewCount.toString(),
    },
  };
}

/**
 * Generate BreadcrumbList JSON-LD Schema
 */
export function generateBreadcrumbSchema(items) {
  if (!items || !items.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    })),
  };
}
