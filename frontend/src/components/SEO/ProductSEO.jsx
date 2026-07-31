import React from "react";
import SEO from "./SEO";
import { SITE_URL, generateProductSchema, generateBreadcrumbSchema } from "../../utils/seo";

export default function ProductSEO({ product }) {
  if (!product) return null;

  const title = `Buy ${product.name} Online`;
  const description = `Premium quality ${product.name}. Fast shipping across India. Order today from Me Nestham by Bhanni.`;
  const canonicalUrl = `${SITE_URL}/products/${product.slug || product.id}`;
  const ogImage = product.featured_image || product.image || (product.images && product.images[0]);

  // Product Schema
  const productSchema = generateProductSchema(product);

  // Breadcrumbs Schema
  const categoryName = product.category ? (product.category.name || product.category) : "Products";
  const categorySlug = product.category ? (product.category.slug || product.category) : "shop";

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Categories", url: "/categories" },
    { name: categoryName, url: `/categories/${categorySlug}` },
    { name: product.name, url: `/products/${product.slug || product.id}` }
  ]);

  const jsonLd = [productSchema, breadcrumbsSchema].filter(Boolean);

  return (
    <SEO
      title={title}
      description={description}
      keywords={`${product.name}, ${categoryName}, Garland Materials, Artificial Flower Petals, Craft Supplies`}
      canonicalUrl={canonicalUrl}
      ogImage={ogImage}
      ogType="product"
      jsonLd={jsonLd}
    />
  );
}
