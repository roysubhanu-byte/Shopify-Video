// src/lib/api.health.ts
import { API_URL } from './config';

export async function checkApiHealth(): Promise<boolean> {
  try {
    // In dev we can still use the API_URL directly — it’s consistent.
    const healthUrl = `${API_URL}/healthz`;

    const response = await fetch(healthUrl, {
      method: 'GET',
      // 5s timeout so it doesn’t hang the UI
      signal: AbortSignal.timeout(5000),
    });

    // Don’t just rely on status; parse and ensure ok=true if present
    if (!response.ok) return false;

    const json = await response.json().catch(() => ({}));
    if (typeof json === 'object' && json !== null) {
      if ('ok' in json && json.ok === true) return true;
    }

    // If no body shape, treat any 2xx as healthy
    return true;
  } catch {
    return false;
  }
}

export async function waitForApi(maxAttempts = 1, delayMs = 0): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const isHealthy = await checkApiHealth();
    if (isHealthy) return true;
    if (i < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}
