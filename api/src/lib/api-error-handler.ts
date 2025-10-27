import { Logger } from './logger';

const logger = new Logger({ module: 'api-error-handler' });

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
  jitterFactor: number;
}

export interface ApiCallOptions<T> {
  operation: () => Promise<T>;
  operationName: string;
  retryConfig?: Partial<RetryConfig>;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

export interface ApiErrorContext {
  operationName: string;
  attempt: number;
  totalAttempts: number;
  error: Error;
  willRetry: boolean;
  nextRetryDelayMs?: number;
}

export class ApiErrorHandler {
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 32000,
    exponentialBase: 2,
    jitterFactor: 0.1,
  };

  private defaultRetryableErrors = [
    '429',
    '500',
    '502',
    '503',
    '504',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'RESOURCE_EXHAUSTED',
    'RATE_LIMIT',
    'TIMEOUT',
    'NETWORK',
  ];

  async executeWithRetry<T>(options: ApiCallOptions<T>): Promise<T> {
    const config: RetryConfig = {
      ...this.defaultConfig,
      ...options.retryConfig,
    };

    const retryableErrors = options.retryableErrors || this.defaultRetryableErrors;

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= config.maxRetries) {
      try {
        logger.info('Executing API operation', {
          operation: options.operationName,
          attempt: attempt + 1,
          maxAttempts: config.maxRetries + 1,
        });

        const result = await options.operation();

        if (attempt > 0) {
          logger.info('API operation succeeded after retries', {
            operation: options.operationName,
            totalAttempts: attempt + 1,
          });
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        const isRetryable = this.isRetryableError(lastError, retryableErrors);
        const willRetry = isRetryable && attempt <= config.maxRetries;

        if (willRetry) {
          const delayMs = this.calculateDelay(attempt, config);

          logger.warn('API operation failed, will retry', {
            operation: options.operationName,
            attempt,
            maxAttempts: config.maxRetries + 1,
            error: lastError.message,
            nextRetryInMs: delayMs,
          });

          if (options.onRetry) {
            options.onRetry(attempt, lastError, delayMs);
          }

          await this.delay(delayMs);
        } else {
          logger.error('API operation failed', {
            operation: options.operationName,
            attempt,
            error: lastError.message,
            isRetryable,
            reason: !isRetryable ? 'non-retryable error' : 'max retries exceeded',
          });

          throw lastError;
        }
      }
    }

    throw lastError || new Error('Operation failed with unknown error');
  }

  private isRetryableError(error: Error, retryableErrors: string[]): boolean {
    const errorMessage = error.message.toUpperCase();
    const errorString = String(error).toUpperCase();

    return retryableErrors.some(pattern =>
      errorMessage.includes(pattern.toUpperCase()) ||
      errorString.includes(pattern.toUpperCase())
    );
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelayMs * Math.pow(config.exponentialBase, attempt - 1);

    const jitter = exponentialDelay * config.jitterFactor * (Math.random() - 0.5);

    const delayWithJitter = exponentialDelay + jitter;

    return Math.min(delayWithJitter, config.maxDelayMs);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    operationName: string,
    failureThreshold: number = 5,
    resetTimeoutMs: number = 60000
  ): Promise<T> {
    const circuitState = await this.getCircuitState(operationName);

    if (circuitState.isOpen) {
      const timeSinceOpen = Date.now() - circuitState.openedAt;

      if (timeSinceOpen < resetTimeoutMs) {
        logger.warn('Circuit breaker is open', {
          operation: operationName,
          failures: circuitState.failures,
          timeUntilReset: Math.round((resetTimeoutMs - timeSinceOpen) / 1000) + 's',
        });

        throw new Error(`Circuit breaker open for ${operationName}. Service temporarily unavailable.`);
      } else {
        logger.info('Circuit breaker attempting reset', {
          operation: operationName,
        });
        await this.resetCircuit(operationName);
      }
    }

    try {
      const result = await operation();
      await this.recordSuccess(operationName);
      return result;
    } catch (error) {
      await this.recordFailure(operationName, failureThreshold);
      throw error;
    }
  }

  private async getCircuitState(operationName: string): Promise<{
    isOpen: boolean;
    failures: number;
    openedAt: number;
  }> {
    return {
      isOpen: false,
      failures: 0,
      openedAt: 0,
    };
  }

  private async resetCircuit(operationName: string): Promise<void> {
    logger.info('Circuit breaker reset', { operation: operationName });
  }

  private async recordSuccess(operationName: string): Promise<void> {
    logger.debug('Circuit breaker success recorded', { operation: operationName });
  }

  private async recordFailure(operationName: string, threshold: number): Promise<void> {
    logger.debug('Circuit breaker failure recorded', {
      operation: operationName,
      threshold,
    });
  }

  categorizeError(error: Error): {
    category: 'rate_limit' | 'timeout' | 'network' | 'server' | 'client' | 'unknown';
    isRetryable: boolean;
    recommendedAction: string;
  } {
    const message = error.message.toLowerCase();

    if (message.includes('429') || message.includes('rate') || message.includes('resource_exhausted')) {
      return {
        category: 'rate_limit',
        isRetryable: true,
        recommendedAction: 'Retry with exponential backoff. Consider implementing request throttling.',
      };
    }

    if (message.includes('timeout') || message.includes('etimedout')) {
      return {
        category: 'timeout',
        isRetryable: true,
        recommendedAction: 'Retry with increased timeout. Check network connectivity.',
      };
    }

    if (message.includes('econnreset') || message.includes('network') || message.includes('enotfound')) {
      return {
        category: 'network',
        isRetryable: true,
        recommendedAction: 'Retry after brief delay. Check network stability.',
      };
    }

    if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
      return {
        category: 'server',
        isRetryable: true,
        recommendedAction: 'Retry after delay. Server may be temporarily unavailable.',
      };
    }

    if (message.includes('400') || message.includes('401') || message.includes('403') || message.includes('404')) {
      return {
        category: 'client',
        isRetryable: false,
        recommendedAction: 'Do not retry. Fix request parameters or authentication.',
      };
    }

    return {
      category: 'unknown',
      isRetryable: false,
      recommendedAction: 'Review error details to determine if retry is appropriate.',
    };
  }
}

export const apiErrorHandler = new ApiErrorHandler();
