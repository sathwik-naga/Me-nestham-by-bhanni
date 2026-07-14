const API_URL = "http://localhost:5000/api";

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
  
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, config);
  } catch (netErr) {
    throw new ApiError("Network connection failure. Please check your internet connectivity.", 0);
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
    } else if (response.status === 401) {
      errorMsg = data.message || "Unauthorized: Please log in again.";
    } else if (response.status === 403) {
      errorMsg = data.message || "Forbidden: You do not have permission to perform this action.";
    } else if (response.status === 404) {
      errorMsg = data.message || "Not Found: The requested resource does not exist.";
    } else if (response.status === 500) {
      errorMsg = data.message || "Internal Server Error: Something went wrong on the server.";
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