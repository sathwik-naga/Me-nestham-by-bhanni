import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, initAnalyticsIfConsented, initWebVitalsObserver } from "../services/analytics/analytics";

export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Initialize analytics scripts if consented
    initAnalyticsIfConsented();
    initWebVitalsObserver();
  }, []);

  useEffect(() => {
    // Track SPA route transitions automatically
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);
}

export default useAnalytics;
