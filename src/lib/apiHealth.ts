import { API_URL } from './config';

export async function checkApiHealth(): Promise<boolean> {
  try {
    const healthUrl = import.meta.env.DEV
      ? '/api/healthz'
      : `${API_URL}/healthz`;

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function waitForApi(maxAttempts = 10, delayMs = 1000): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const isHealthy = await checkApiHealth();
    if (isHealthy) {
      return true;
    }
    if (i < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
}
