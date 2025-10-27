// src/lib/api.health.ts
import { API_URL } from './config';

/**
 * Always hit the deployed API's /healthz.
 * Adds cache-buster and very clear logging.
 */
export async function checkApiHealth(): Promise<boolean> {
  const healthUrl = `${API_URL.replace(/\/+$/, '')}/healthz?ts=${Date.now()}`;

  try {
    const res = await fetch(healthUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });

    const ok = res.ok;
    // Try to read JSON (optional)
    let body: any = null;
    try { body = await res.json(); } catch {}

    console.log('[health] →', healthUrl, 'status=', res.status, 'ok=', ok, 'body=', body);
    return ok;
  } catch (err) {
    console.warn('[health] request failed →', healthUrl, err);
    return false;
  }
}

export async function waitForApi(maxAttempts = 8, delayMs = 800): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const alive = await checkApiHealth();
    if (alive) return true;
    if (i < maxAttempts - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return false;
}
