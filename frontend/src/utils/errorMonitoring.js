/**
 * Frontend Production Error Monitoring & Tracking Interface
 * Pre-configured for Sentry / LogRocket / Custom Monitoring Telemetry
 */

export function initErrorMonitoring() {
  if (typeof window === 'undefined') return;

  // 1. Capture Unhandled JavaScript Exceptions
  window.addEventListener('error', (event) => {
    reportErrorToTelemetry({
      type: 'REACT_UNCAUGHT_EXCEPTION',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  });

  // 2. Capture Unhandled Promise Rejections
  window.addEventListener('unhandledrejection', (event) => {
    reportErrorToTelemetry({
      type: 'UNHANDLED_PROMISE_REJECTION',
      reason: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
    });
  });

  console.log('Production Error Monitoring initialized successfully.');
}

/**
 * Report error to Telemetry service or Sentry
 */
export function reportErrorToTelemetry(errorDetails) {
  const payload = {
    ...errorDetails,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.warn('[ERROR MONITORING CAPTURE]', payload);
    return;
  }

  // Dispatch to Sentry / Telemetry Endpoint
  try {
    if (window.Sentry) {
      window.Sentry.captureException(errorDetails);
    }
  } catch (e) {
    // Ignore telemetry send failure
  }
}
