let isGtmInitialized = false;

/**
 * Initialize Google Tag Manager script safely once
 */
export function initGTM() {
  if (isGtmInitialized || typeof window === "undefined") return;

  const gtmId = import.meta.env.VITE_GTM_ID;
  window.dataLayer = window.dataLayer || [];

  if (gtmId) {
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l != "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", gtmId);
  }

  isGtmInitialized = true;
}

/**
 * Push structured event payload to GTM dataLayer
 */
export function pushToDataLayer(payload) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}
