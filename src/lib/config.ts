// src/lib/config.ts
export const API_URL = (() => {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  const url = envUrl || 'http://localhost:8787';

  // Show where we’re pointing (helpful in DevTools)
  console.log('[config] API_URL =', url);

  // Remove trailing slashes
  return url.replace(/\/+$/, '');
})();

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === '1';
export const APP_URL  = import.meta.env.VITE_APP_URL  || 'http://localhost:5173';
