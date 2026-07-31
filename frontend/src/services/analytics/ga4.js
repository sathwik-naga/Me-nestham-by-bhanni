let isGaInitialized = false;

/**
 * Initialize GA4 gtag.js script safely once
 */
export function initGA4() {
  if (isGaInitialized || typeof window === "undefined") return;

  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (gaId) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", gaId, { send_page_view: false });
  }

  isGaInitialized = true;
}

/**
 * Standard GA4 Item Formatter
 */
export function formatGa4Item(item) {
  if (!item) return null;
  return {
    item_id: item.id || item.slug || "",
    item_name: item.name || item.product_name || "",
    item_category: item.category || "General",
    price: Number(item.price || item.unit_price || 0),
    quantity: Number(item.quantity || 1),
    currency: "INR",
  };
}
