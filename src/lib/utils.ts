import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Route an external image URL through the same-origin image proxy.
 * This avoids CORS/blocking issues in restricted preview environments.
 * Returns the original URL if it's already a relative path or data URI.
 */
export function proxyImg(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("/")) return url;
  if (url.startsWith("data:")) return url;
  return `/api/img?url=${encodeURIComponent(url)}`;
}
