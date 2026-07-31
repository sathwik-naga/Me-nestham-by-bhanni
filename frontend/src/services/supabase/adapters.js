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

  // Map variants to the frontend format, supporting size/color/stock database columns
  const variants = product.variants?.map((v) => ({
    id: v.id,
    type: "Variant",
    name: v.name || [v.color, v.size].filter(Boolean).join(" / ") || "Default",
    sku: v.sku || "",
    price: Number(v.price || product.price),
    sale_price: v.sale_price !== null && v.sale_price !== undefined ? Number(v.sale_price) : null,
    stock: v.stock !== undefined ? v.stock : (v.stock_quantity || 0),
    weight: v.weight ? Number(v.weight) : null,
    is_default: v.is_default || false,
    status: v.status || 'active',
    options: v.options || [],
    images: (v.images || []).map((img, idx) => ({
      id: img.id || `img-${idx}`,
      image_url: typeof img === 'string' ? img : (img.image_url || img.url || ""),
      storage_path: typeof img === 'object' ? img.storage_path : null,
      media_type: typeof img === 'object' ? (img.media_type || "image") : "image",
      alt_text: typeof img === 'object' ? (img.alt_text || null) : null,
      sort_order: typeof img === 'object' ? (img.sort_order !== undefined ? img.sort_order : (img.position !== undefined ? img.position : idx)) : idx,
      is_primary: typeof img === 'object' ? !!img.is_primary : idx === 0,
    }))
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
    categories: product.category ? { slug: product.category.slug, name: product.category.name } : null,

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

export function mapOrder(order) {
  if (!order) return null;
  
  const shippingAddress = {
    fullName: order.shipping_address?.full_name || "",
    phone: order.shipping_address?.phone || "",
    addressLine1: order.shipping_address?.address_line1 || "",
    addressLine2: order.shipping_address?.address_line2 || "",
    city: order.shipping_address?.city || "",
    state: order.shipping_address?.state || "",
    pincode: order.shipping_address?.postal_code || "",
    addressType: order.shipping_address?.address_type || "Home"
  };

  const billingAddress = {
    fullName: order.billing_address?.full_name || "",
    phone: order.billing_address?.phone || "",
    addressLine1: order.billing_address?.address_line1 || "",
    addressLine2: order.billing_address?.address_line2 || "",
    city: order.billing_address?.city || "",
    state: order.billing_address?.state || "",
    pincode: order.billing_address?.postal_code || "",
    addressType: order.billing_address?.address_type || "Home"
  };

  const items = order.items?.map((item) => ({
    id: item.product_id,
    name: item.product_name,
    slug: item.product_slug,
    image: item.featured_image || "/placeholder.png",
    price: Number(item.unit_price),
    quantity: item.quantity,
    variant: item.variant_name || item.variant || ""
  })) || [];

  const orderStatus = order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1)) : "Pending";
  const orderPaymentStatus = order.payment_status ? (order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)) : "Pending";

  return {
    id: order.id,
    userId: order.user_id,
    date: order.created_at,
    items,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shipping: Number(order.shipping),
    total: Number(order.grand_total),
    couponCode: order.coupon_code || "",
    shippingAddress,
    billingAddress,
    shippingMethod: order.shipping_method || "Standard Delivery",
    paymentMethod: order.payment_method || "COD",
    paymentStatus: orderPaymentStatus,
    status: orderStatus,
    trackingNumber: order.tracking_number || "",
    shipmentId: order.shipment_id || null,
    shiprocketOrderId: order.shiprocket_order_id || null,
    courierCompanyId: order.courier_company_id || null,
    shippingStatusCode: order.shipping_status_code || null,
    awbCode: order.awb_code || null,
    courierName: order.courier_name || null,
    trackingUrl: order.tracking_url || null,
    shippingStatus: order.shipping_status || null,
    pickupStatus: order.pickup_status || null,
    labelUrl: order.label_url || null,
    invoiceUrl: order.invoice_url || null,
    manifestUrl: order.manifest_url || null,
    estimatedDelivery: order.estimated_delivery || null,
    shippedAt: order.shipped_at || null,
    deliveredAt: order.delivered_at || null,
    trackingEvents: order.tracking_events || [],
    history: [
      { status: "Placed", date: order.created_at, note: "Order placed by customer." },
      ...(order.status !== "pending" ? [{ status: orderStatus, date: order.updated_at || order.created_at, note: `Order status updated to ${orderStatus}.` }] : [])
    ]
  };
}