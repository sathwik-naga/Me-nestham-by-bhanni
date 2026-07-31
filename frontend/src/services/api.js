import { clearAuthSession, isTokenExpired } from "../utils/authHelper";

/**
 * Helper to dynamically resolve and normalize the Express API URL
 * Guarantees '/api' path suffix regardless of trailing slash or missing '/api' in VITE_API_URL
 */
export function getApiUrl() {
  const envUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const trimmed = envUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export const API_URL = getApiUrl();

const activeControllers = new Set();
let isLoggingOut = false;

// Premium Toast Notification
export function showToast(message, duration = 4000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.bottom = "24px";
    container.style.right = "24px";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "8px";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.innerText = message;
  toast.style.background = "#1e1e1e";
  toast.style.color = "#ffffff";
  toast.style.padding = "12px 24px";
  toast.style.borderRadius = "12px";
  toast.style.fontSize = "13px";
  toast.style.fontWeight = "500";
  toast.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)";
  toast.style.opacity = "0";
  toast.style.transition = "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
  toast.style.transform = "translateY(20px)";
  toast.style.pointerEvents = "auto";
  toast.style.fontFamily = "Outfit, sans-serif";
  toast.style.borderLeft = "4px solid #D4AF37"; // Premium gold color

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 10);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

// Monkey-patch console.error to filter out noisy 401/403 stack traces
const originalConsoleError = console.error;
let loggedSessionExpired = false;

console.error = function (...args) {
  const isAuthError = args.some(arg => {
    if (!arg) return false;
    if (arg.status === 401 || arg.status === 403) return true;
    if (arg instanceof Error) {
      return arg.message?.includes("Session expired") || 
             arg.message?.includes("Unauthorized") || 
             arg.message?.includes("expired session token") ||
             arg.message?.includes("401");
    }
    const str = String(arg);
    return str.includes("Session expired") || 
           str.includes("Unauthorized") || 
           str.includes("expired session token") ||
           str.includes("401");
  });

  if (isAuthError) {
    if (!loggedSessionExpired) {
      console.warn("Session expired. User has been logged out.");
      loggedSessionExpired = true;
      setTimeout(() => { loggedSessionExpired = false; }, 5000);
    }
    return;
  }
  originalConsoleError.apply(console, args);
};

export class ApiError extends Error {
  constructor(message, status, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = "ApiError";
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");
  
  // Client-side JWT expiration check
  if (token && isTokenExpired(token)) {
    if (!isLoggingOut) {
      isLoggingOut = true;
      // Save where the user was
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
      clearAuthSession();
      showToast("Your session has expired. Please sign in again.");
      setTimeout(() => {
        isLoggingOut = false;
      }, 5000);
      window.location.href = "/auth";
    }
    throw new ApiError("Session expired. User has been logged out.", 401);
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const controller = new AbortController();
  activeControllers.add(controller);

  const config = {
    ...options,
    headers,
    signal: controller.signal,
  };

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, config);
  } catch (netErr) {
    activeControllers.delete(controller);
    if (netErr.name === "AbortError") {
      throw new ApiError("Request cancelled due to session expiration.", 401);
    }
    throw new ApiError("Network connection failure. Please check your internet connectivity.", 0);
  } finally {
    activeControllers.delete(controller);
  }

  // Intercept global 401 or 403
  if (response.status === 401 || response.status === 403) {
    if (!isLoggingOut) {
      isLoggingOut = true;

      // Save where the user was
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);

      // Abort all other pending requests
      for (const ctrl of activeControllers) {
        ctrl.abort();
      }
      activeControllers.clear();

      // Clear session local states
      clearAuthSession();

      // Show custom toast message
      showToast("Your session has expired. Please sign in again.");

      setTimeout(() => {
        isLoggingOut = false;
      }, 5000);

      // Redirect to authentication login page
      window.location.href = "/auth";
    }

    throw new ApiError("Session expired. User has been logged out.", response.status);
  }

  let data;
  try {
    data = await response.json();
  } catch (jsonErr) {
    if (!response.ok) {
      throw new ApiError(`Request failed with status ${response.status}`, response.status);
    }
    return null;
  }

  if (!response.ok) {
    let errorMsg = data.message || "An unexpected error occurred.";
    let validationErrors = null;

    if (data.errors && Array.isArray(data.errors)) {
      validationErrors = data.errors;
      const parsedErrors = data.errors
        .map(e => {
          const fieldName = e.field.replace(/^(body|query|params)\./, '').replace(/_/g, ' ');
          return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${e.message}`;
        })
        .join(', ');
      errorMsg = `Validation failed: ${parsedErrors}`;
    }

    throw new ApiError(errorMsg, response.status, validationErrors);
  }

  return data;
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),
};

export async function apiRequest(endpoint, options = {}) {
  return request(endpoint, options);
}