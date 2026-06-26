import { API_HOST } from "@/config/constants";

/**
 * Constructs a full avatar URL from a given path, handling cases where
 * the path might be a full URL or just a relative path.
 * @param path The avatar path or full URL.
 * @returns A full, valid URL for the avatar.
 */
export const buildAvatarUrl = (path?: string): string | undefined => {
  if (!path) {
    return undefined;
  }
  // If the path is already a full URL, return it as is.
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // Otherwise, construct the URL using the API host.
  // Ensure we don't have double slashes.
  return `${API_HOST.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

/**
 * Gets the full avatar URL, removing the /api prefix from the cloud URL if present.
 * @param url The relative path or full URL of the avatar.
 * @returns The full avatar URL or undefined.
 */
export const getAvatarUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;

  const cloudUrl = import.meta.env.VITE_APP_WEB_CLOUD_URL || "";
  const baseUrl = cloudUrl.replace(/\/api$/, "").replace(/\/$/, "");

  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
};
