/**
 * Strong Care - Single API Configuration Point
 * Configured for both local development (with PHP backend proxy)
 * and static deployment (such as GitHub Pages).
 */
const hasRealApi = Boolean(import.meta.env.VITE_API_BASE_URL);

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')
    ? '' // In static GitHub Pages mode without backend, handled by resilient demo fallbacks
    : '/api');

export const IS_STATIC_MODE: boolean =
  (typeof window !== 'undefined' && window.location.search.includes('demo=1')) ||
  (!hasRealApi && (import.meta.env.VITE_STATIC_DEMO === 'true' ||
    (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io'))));

