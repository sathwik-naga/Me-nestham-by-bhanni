export function mapProduct(product) {
  // Extract all images starting with the main image_url and then gallery images
  const images = [];
  if (product.image_url) {
    images.push(product.image_url);
  }
  if (product.images && product.images.length > 0) {
    product.images.forEach((img) => {
      if (img.image_url && img.image_url !== product.image_url) {
        images.push(img.image_url);
      }
    });
  }
  if (images.length === 0) {
    images.push("/placeholder.png");
  }

  // Map variants to the frontend format
  const variants = product.variants?.map((v) => ({
    id: v.id,
    type: "Variant",
    name: v.name,
    price: Number(v.price || product.price),
    stock: v.stock_quantity || 0
  })) || [];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,

    price: Number(product.price),
    compareAtPrice: product.compare_price
      ? Number(product.compare_price)
      : null,

    image: product.image_url || images[0] || "/placeholder.png",
    images: images,

    category: product.category?.slug || "",
    categoryName: product.category?.name || "",

    rating: 5,
    reviewCount: 0,

    inStock: product.stock > 0,
    stockCount: product.stock,

    isNew: product.featured || false,
    isBestseller: product.bestseller || false,
    featured: product.featured || false,

    variants: variants,

    description: product.description || "",
    shortDescription: product.short_description || product.description?.substring(0, 100) + "..."
  };
}