/**
 * Image Proxy Helper Utility
 * 
 * Strategy for handling public and private images:
 * 1. If NO credentials configured (isPrivate = false): Always use direct URLs (fast, browser fetch)
 * 2. If credentials configured (isPrivate = true): 
 *    - First try direct URL in browser
 *    - If fails (401/403), fallback to backend proxy with auth
 * 
 * This ensures:
 * - Public images: Fetched directly by browser (no backend overhead)
 * - Private images: Automatically routed through backend proxy with auth
 * - Mixed datasets: Optimal performance for both types
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get the backend proxy URL for an image
 * 
 * @param datasetId - The dataset ID
 * @param imageUrl - The original image URL
 * @param cacheVersion - Optional cache-busting version (dataset updatedAt timestamp)
 * @returns The backend proxy URL
 */
export function getProxiedImageUrl(
  datasetId: string,
  imageUrl: string,
  cacheVersion?: string | number,
): string {
  const baseUrl = `${API_BASE_URL}/image-proxy/${datasetId}?url=${encodeURIComponent(imageUrl)}`;
  // Add cache version to force browser to refetch when credentials are updated
  if (cacheVersion) {
    return `${baseUrl}&v=${cacheVersion}`;
  }
  return baseUrl;
}

/**
 * Check if dataset has authentication configured
 * 
 * @param imageAuthConfig - The dataset's image authentication configuration
 * @returns Whether the dataset has credentials configured
 */
export function hasAuthConfigured(
  imageAuthConfig?: {
    isPrivate: boolean;
    username?: string;
    password?: string;
  },
): boolean {
  return imageAuthConfig?.isPrivate === true && 
         !!imageAuthConfig.username && 
         !!imageAuthConfig.password;
}

/**
 * Get display URL with smart routing
 * 
 * Strategy:
 * - ALWAYS returns direct URL first for maximum performance
 * - Image components handle fallback to proxy on error
 * - This optimizes for mixed datasets (public + private images)
 * 
 * @param datasetId - The dataset ID
 * @param imageUrl - The original image URL
 * @param imageAuthConfig - The dataset's image authentication configuration
 * @returns The URL to use for the image src (always direct URL initially)
 */
export function getImageDisplayUrl(
  datasetId: string,
  imageUrl: string,
  imageAuthConfig?: {
    isPrivate: boolean;
    username?: string;
    password?: string;
  },
): string {
  // Always try direct URL first for best performance
  // Image component will handle fallback if needed
  return imageUrl;
}

