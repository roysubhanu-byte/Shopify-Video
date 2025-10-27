export const API_URL = (() => {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  const url = envUrl || 'http://localhost:8787';

  if (import.meta.env.PROD && url.startsWith('http://localhost')) {
    console.warn('[config] ⚠️ VITE_API_URL missing in production – using localhost:', url);
  } else {
    console.log('[config] API_URL =', url);
  }

  return url.replace(/\/+$/, '');
})();

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === '1';

export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
