/**
 * Strong Care - Single API Configuration Point
 * Configured for both local development (with PHP backend proxy)
 * and static deployment (such as GitHub Pages).
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('github.io')
    ? '' // In static GitHub Pages mode, handled by resilient fallbacks
    : '/api');

export const IS_STATIC_MODE: boolean =
  import.meta.env.VITE_STATIC_DEMO === 'true' ||
  (typeof window !== 'undefined' && window.location.hostname.includes('github.io'));

