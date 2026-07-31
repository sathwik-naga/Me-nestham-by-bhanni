import { supabase } from "../lib/supabase";

export const BUCKET_NAME = "product-images";
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const API_URL = "http://localhost:5000/api";

/**
 * Validates file type and 5 MB size limit
 */
export function validateImageFile(file) {
  if (!file) return "No file selected.";

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
  const isValidType = ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(fileExt);
  
  if (!isValidType) {
    return `"${file.name}" is an unsupported format. Only JPG, JPEG, PNG, and WEBP images are allowed.`;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return `"${file.name}" (${sizeMB} MB) exceeds the 5 MB file size limit.`;
  }

  return null;
}

/**
 * Compresses an image file client-side using HTML5 Canvas into WebP format
 */
export async function compressImageToWebP(file, maxDimension = 1600, quality = 0.88) {
  return new Promise((resolve) => {
    // If browser doesn't support Canvas or URL, fallback to original file
    if (typeof window === "undefined" || !window.createObjectURL && !window.URL?.createObjectURL) {
      return resolve(file);
    }

    const img = new Image();
    const blobUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(file);
    };

    img.src = blobUrl;
  });
}

/**
 * Helper to extract path inside bucket from full public URL
 */
export function extractStoragePath(urlOrPath) {
  if (!urlOrPath) return null;
  if (!urlOrPath.startsWith("http")) return urlOrPath;

  try {
    const parsed = new URL(urlOrPath);
    if (parsed.pathname.includes(`/object/public/${BUCKET_NAME}/`)) {
      const parts = parsed.pathname.split(`/object/public/${BUCKET_NAME}/`);
      if (parts.length > 1) return parts[1];
    } else if (parsed.pathname.includes("/object/public/products/")) {
      const parts = parsed.pathname.split("/object/public/products/");
      if (parts.length > 1) return parts[1];
    }
  } catch (e) {
    console.warn("Failed to parse storage URL:", e);
  }
  return null;
}

/**
 * Uploads file via Express backend API (/api/admin/upload-image)
 * The backend authenticates the Admin JWT and uploads to Supabase Storage
 * using the SUPABASE_SERVICE_ROLE_KEY.
 */
export async function uploadProductImageToStorage({ file, productId = null, variantId = null, tempFolderId = null, onProgress }) {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  onProgress?.(15);

  // Compress to WebP blob
  const blob = await compressImageToWebP(file);
  onProgress?.(40);

  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Authentication required. Please log in as an administrator to upload images.");
  }

  const formData = new FormData();
  const cleanBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  formData.append("image", blob, `${cleanBaseName}.webp`);
  if (productId) formData.append("productId", productId);
  if (variantId) formData.append("variantId", variantId);
  if (tempFolderId) formData.append("tempFolderId", tempFolderId);

  onProgress?.(60);

  const response = await fetch(`${API_URL}/admin/upload-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  onProgress?.(85);

  const resData = await response.json();

  if (!response.ok || resData.status !== "success") {
    throw new Error(resData.message || "Failed to upload image via Express backend API.");
  }

  onProgress?.(100);

  return {
    publicUrl: resData.data.publicUrl,
    storagePath: resData.data.storagePath
  };
}

/**
 * Deletes file via Express backend API (/api/admin/delete-image)
 */
export async function deleteProductImageFromStorage(urlOrPath) {
  const storagePath = extractStoragePath(urlOrPath);
  if (!storagePath && !urlOrPath) return;

  const token = localStorage.getItem("access_token");
  if (!token) return;

  try {
    await fetch(`${API_URL}/admin/delete-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        imageUrl: urlOrPath,
        storagePath: storagePath || urlOrPath
      })
    });
  } catch (err) {
    console.warn("Failed to delete image via Express backend API:", err);
  }
}
