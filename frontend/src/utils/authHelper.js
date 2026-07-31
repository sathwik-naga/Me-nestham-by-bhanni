/**
 * Centralized Authentication Session Recovery Helper
 */

/**
 * Checks if a JWT token is expired client-side.
 * Decodes the base64 payload and compares 'exp' with current time.
 */
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return false; // If no exp claim, consider it not expired
    return Date.now() >= payload.exp * 1000;
  } catch (e) {
    return true; // Malformed or unparseable token is considered expired/invalid
  }
}

export function clearAuthSession() {
  // 1. Remove standard auth storage keys and extra user-specific caches
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("mn_current_user");
  
  // Clear additional user caches
  localStorage.removeItem("mn_cart_cache");
  localStorage.removeItem("mn_addresses");
  localStorage.removeItem("mn_orders");
  localStorage.removeItem("mn_profile");
  localStorage.removeItem("mn_recent_products");

  // 2. Clear user-specific authenticated caches from LocalStorage
  // (e.g., user-specific wishlists like mn_wishlist_<userId>)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("mn_wishlist_") && key !== "mn_wishlist_guest") {
        localStorage.removeItem(key);
        i--; // Adjust index as key removal shifts array
      }
    }
  } catch (e) {
    console.warn("Failed to clear cached wishlist keys from localStorage:", e);
  }

  // 3. Dispatch global custom event to notify all React Contexts and pages
  window.dispatchEvent(new CustomEvent("mn-auth-logout"));
}
