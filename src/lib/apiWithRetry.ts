import { API_URL } from './config';

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  exponentialBase: 2,
};

function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(config.exponentialBase, attempt - 1);
  const jitter = exponentialDelay * 0.1 * (Math.random() - 0.5);
  const delayWithJitter = exponentialDelay + jitter;
  return Math.min(delayWithJitter, config.maxDelayMs);
}

function isRetryableError(error: any): boolean {
  if (error.statusCode) {
    return [408, 429, 500, 502, 503, 504].includes(error.statusCode);
  }

  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    message.includes('temporarily unavailable')
  );
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...defaultRetryConfig, ...config };
  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= retryConfig.maxRetries) {
    try {
      console.log(`[Retry] ${operationName} - Attempt ${attempt + 1}/${retryConfig.maxRetries + 1}`);

      const result = await operation();

      if (attempt > 0) {
        console.log(`[Retry] ${operationName} succeeded after ${attempt + 1} attempts`);
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      const isRetryable = isRetryableError(lastError);
      const willRetry = isRetryable && attempt <= retryConfig.maxRetries;

      if (willRetry) {
        const delayMs = calculateDelay(attempt, retryConfig);
        console.warn(`[Retry] ${operationName} failed (attempt ${attempt}), retrying in ${delayMs}ms:`, {
          error: lastError.message,
          isRetryable,
          nextAttempt: attempt + 1,
        });

        await delay(delayMs);
      } else {
        console.error(`[Retry] ${operationName} failed permanently after ${attempt} attempts:`, {
          error: lastError.message,
          isRetryable,
        });

        throw lastError;
      }
    }
  }

  throw lastError || new Error('Operation failed with unknown error');
}

export async function checkApiHealthWithRetry(): Promise<boolean> {
  try {
    const response = await fetchWithRetry(
      async () => {
        const res = await fetch(`${API_URL}/healthz`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
          throw new Error(`Health check failed: ${res.status}`);
        }

        return res;
      },
      'API Health Check',
      { maxRetries: 2, baseDelayMs: 500 }
    );

    const json = await response.json().catch(() => ({}));
    return json.ok === true || response.ok;
  } catch (error) {
    console.error('[Health Check] API is not healthy:', error);
    return false;
  }
}
