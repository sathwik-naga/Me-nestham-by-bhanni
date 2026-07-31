import { initGTM, pushToDataLayer } from "./gtm";
import { initGA4, formatGa4Item } from "./ga4";
import { initMetaPixel, trackMetaPixelEvent } from "./metaPixel";

const CONSENT_KEY = "mn_cookie_consent";
const eventCache = new Set();

/**
 * Get stored privacy cookie consent choices
 */
export function getStoredConsent() {
  if (typeof window === "undefined") return { version: 1, analytics: false, marketing: false };
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Save cookie consent choices with version and audit timestamp
 */
export function saveConsent(choices) {
  if (typeof window === "undefined") return;
  const payload = {
    version: 1,
    analytics: Boolean(choices.analytics),
    marketing: Boolean(choices.marketing),
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
  initAnalyticsIfConsented();
}

/**
 * Check if browser Do Not Track is enabled
 */
export function isDoNotTrackEnabled() {
  if (typeof window === "undefined" || !navigator) return false;
  return navigator.doNotTrack === "1" || window.doNotTrack === "1";
}

/**
 * Initialize scripts if consent is granted and DNT is not active
 */
export function initAnalyticsIfConsented() {
  if (typeof window === "undefined") return;

  const consent = getStoredConsent();
  const dnt = isDoNotTrackEnabled();

  // If user enabled DNT or rejected non-essential, do not load tracking scripts
  if (dnt) {
    console.info("[Analytics] Do Not Track active. External tracking suppressed.");
    return;
  }

  if (consent?.analytics) {
    initGTM();
    initGA4();
  }

  if (consent?.marketing) {
    initMetaPixel();
  }
}

/**
 * Internal dispatch helper supporting Dev Console logging vs GTM/GA4/Meta Pixel
 */
function dispatchEvent(eventName, payload = {}, metaEventName = null) {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    console.log(`[Analytics DEV] Event: ${eventName}`, payload);
    return;
  }

  const consent = getStoredConsent();
  if (!consent?.analytics && !consent?.marketing) return;

  // GTM dataLayer push
  pushToDataLayer({
    event: eventName,
    ...payload,
  });

  // GA4 gtag push if window.gtag exists
  if (typeof window !== "undefined" && typeof window.gtag === "function" && consent?.analytics) {
    window.gtag("event", eventName, payload);
  }

  // Meta Pixel push if consent granted
  if (metaEventName && consent?.marketing) {
    trackMetaPixelEvent(metaEventName, payload);
  }
}

/**
 * SPA Page View Tracking with Deduplication
 */
export function trackPageView(path, title) {
  const cacheKey = `page_view_${path}`;
  if (eventCache.has(cacheKey)) {
    // Already tracked for this path instance
    return;
  }
  eventCache.add(cacheKey);
  setTimeout(() => eventCache.delete(cacheKey), 3000);

  dispatchEvent("page_view", {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  }, "PageView");
}

/**
 * E-Commerce: View Item (Product Detail)
 */
export function trackViewItem(product) {
  if (!product) return;
  const cacheKey = `view_item_${product.id || product.slug}`;
  if (eventCache.has(cacheKey)) return;
  eventCache.add(cacheKey);
  setTimeout(() => eventCache.delete(cacheKey), 5000);

  const formattedItem = formatGa4Item(product);
  dispatchEvent("view_item", {
    currency: "INR",
    value: Number(product.price || 0),
    items: [formattedItem],
  }, "ViewContent");
}

/**
 * E-Commerce: Add to Cart
 */
export function trackAddToCart(item, quantity = 1) {
  if (!item) return;
  const formattedItem = formatGa4Item({ ...item, quantity });
  const totalValue = Number(item.price || item.unit_price || 0) * quantity;

  dispatchEvent("add_to_cart", {
    currency: "INR",
    value: totalValue,
    items: [formattedItem],
  }, "AddToCart");
}

/**
 * E-Commerce: Remove from Cart
 */
export function trackRemoveFromCart(item) {
  if (!item) return;
  const formattedItem = formatGa4Item(item);
  dispatchEvent("remove_from_cart", {
    currency: "INR",
    value: Number(item.price || item.unit_price || 0),
    items: [formattedItem],
  });
}

/**
 * E-Commerce: View Cart
 */
export function trackViewCart(cartItems = [], totalValue = 0) {
  const items = cartItems.map(formatGa4Item).filter(Boolean);
  dispatchEvent("view_cart", {
    currency: "INR",
    value: Number(totalValue),
    items,
  });
}

/**
 * E-Commerce: Add to Wishlist
 */
export function trackAddToWishlist(product) {
  if (!product) return;
  const formattedItem = formatGa4Item(product);
  dispatchEvent("add_to_wishlist", {
    currency: "INR",
    value: Number(product.price || 0),
    items: [formattedItem],
  });
}

/**
 * E-Commerce: Begin Checkout
 */
export function trackBeginCheckout(cartItems = [], totalValue = 0) {
  const items = cartItems.map(formatGa4Item).filter(Boolean);
  dispatchEvent("begin_checkout", {
    currency: "INR",
    value: Number(totalValue),
    items,
  }, "InitiateCheckout");
}

/**
 * E-Commerce: Purchase Event (Fires ONLY after confirmed payment & order creation)
 */
export function trackPurchase(order) {
  if (!order || !order.id) return;
  const cacheKey = `purchase_${order.id}`;
  if (eventCache.has(cacheKey)) return; // Prevent duplicate purchase firing
  eventCache.add(cacheKey);

  const items = (order.items || []).map((i) => formatGa4Item({
    id: i.product_id || i.id,
    name: i.product_name || i.name,
    price: i.unit_price || i.price,
    quantity: i.quantity,
    category: i.category,
  })).filter(Boolean);

  dispatchEvent("purchase", {
    transaction_id: order.id,
    value: Number(order.grand_total || order.total || 0),
    tax: Number(order.tax_amount || 0),
    shipping: Number(order.shipping_fee || 0),
    coupon: order.coupon_code || "",
    currency: "INR",
    items,
  }, "Purchase");
}

/**
 * Search Event with Zero-Result Tracking
 */
export function trackSearch(searchTerm, resultCount = 0) {
  if (!searchTerm) return;
  dispatchEvent("search", {
    search_term: searchTerm,
    result_count: resultCount,
    is_zero_result: resultCount === 0,
  }, "Search");
}

/**
 * Contact & Lead Generation Events
 */
export function trackLead(formName = "contact_form") {
  dispatchEvent("generate_lead", {
    form_name: formName,
  }, "Contact");
}

export function trackWhatsAppClick() {
  dispatchEvent("whatsapp_click", {
    channel: "WhatsApp",
  });
}

export function trackPhoneClick() {
  dispatchEvent("phone_click", {
    channel: "Phone",
  });
}

export function trackEmailClick() {
  dispatchEvent("email_click", {
    channel: "Email",
  });
}

/**
 * User Auth Events (No PII sent)
 */
export function trackAuth(method = "login") {
  const eventName = method === "signup" ? "sign_up" : method === "login" ? "login" : "logout";
  dispatchEvent(eventName, {
    method: "email_or_oauth",
  });
}

/**
 * Application Exception & Error Monitoring
 */
export function trackException(errorType, message, context = {}) {
  const safeMessage = (message || "Unknown error").substring(0, 150);
  dispatchEvent("exception", {
    description: `${errorType}: ${safeMessage}`,
    fatal: false,
    component: context.component || "Storefront",
  });
}

/**
 * Core Web Vitals Monitoring
 */
export function initWebVitalsObserver() {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "largest-contentful-paint") {
          dispatchEvent("web_vitals_lcp", { value: Math.round(entry.startTime) });
        } else if (entry.entryType === "layout-shift" && !entry.hadRecentInput) {
          dispatchEvent("web_vitals_cls", { value: Math.round(entry.value * 1000) });
        }
      }
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
    observer.observe({ type: "layout-shift", buffered: true });
  } catch (e) {}
}
