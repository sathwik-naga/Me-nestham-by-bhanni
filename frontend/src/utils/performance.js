const activeRequests = new Map();
const inMemoryCache = new Map();

/**
 * Deduplicate concurrent API GET requests with identical URLs
 */
export async function deduplicatedFetch(url, fetcher, ttlMs = 180000) {
  const now = Date.now();

  // 1. Check in-memory cache
  if (inMemoryCache.has(url)) {
    const cached = inMemoryCache.get(url);
    if (now - cached.timestamp < ttlMs) {
      // Revalidate in background if cache is older than half TTL
      if (now - cached.timestamp > ttlMs / 2) {
        fetcher().then((freshData) => {
          inMemoryCache.set(url, { timestamp: Date.now(), data: freshData });
        }).catch(() => {});
      }
      return cached.data;
    }
  }

  // 2. Check active in-flight request deduplication
  if (activeRequests.has(url)) {
    return activeRequests.get(url);
  }

  // 3. Initiate fresh request
  const requestPromise = fetcher()
    .then((data) => {
      inMemoryCache.set(url, { timestamp: Date.now(), data });
      activeRequests.delete(url);
      return data;
    })
    .catch((err) => {
      activeRequests.delete(url);
      throw err;
    });

  activeRequests.set(url, requestPromise);
  return requestPromise;
}

/**
 * Route prefetching helper for key storefront routes (/shop, /categories)
 */
export function prefetchRoute(importFn) {
  if (typeof window === "undefined") return;
  // Use requestIdleCallback if available, or fallback to setTimeout
  const prefetch = () => {
    importFn().catch(() => {});
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(prefetch, { timeout: 4000 });
  } else {
    setTimeout(prefetch, 2000);
  }
}
