export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/healthz', {
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
