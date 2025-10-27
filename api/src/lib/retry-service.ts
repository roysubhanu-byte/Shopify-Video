import { Logger } from './logger';
import { supabase } from './supabase';
import { qualityValidator, QualityValidationSummary } from './quality-validator';

const logger = new Logger({ module: 'retry-service' });

export interface RetryDecision {
  shouldRetry: boolean;
  isFreeRetry: boolean;
  reason: string;
  failureCategory: 'api_error' | 'timeout' | 'quality_validation' | 'user_cancelled' | 'other';
  maxRetriesReached: boolean;
}

export class RetryService {
  private maxFreeRetries = 1;
  private retryDelayMs = 2000;

  async evaluateRetryEligibility(
    beatGenerationId: string,
    error?: Error,
    qualityValidation?: QualityValidationSummary
  ): Promise<RetryDecision> {
    logger.info('Evaluating retry eligibility', { beatGenerationId });

    try {
      const { data: beatGen, error: fetchError } = await supabase
        .from('beat_generations')
        .select('*')
        .eq('id', beatGenerationId)
        .maybeSingle();

      if (fetchError || !beatGen) {
        return {
          shouldRetry: false,
          isFreeRetry: false,
          reason: 'Beat generation not found',
          failureCategory: 'other',
          maxRetriesReached: false,
        };
      }

      const retryCount = await this.getRetryCount(beatGenerationId);

      if (retryCount >= this.maxFreeRetries) {
        return {
          shouldRetry: false,
          isFreeRetry: false,
          reason: 'Maximum free retries reached',
          failureCategory: beatGen.failure_category || 'other',
          maxRetriesReached: true,
        };
      }

      if (error) {
        const errorType = this.categorizeError(error);

        if (errorType === 'api_error' || errorType === 'timeout') {
          return {
            shouldRetry: true,
            isFreeRetry: true,
            reason: `Automatic retry due to ${errorType}`,
            failureCategory: errorType,
            maxRetriesReached: false,
          };
        }
      }

      if (qualityValidation && !qualityValidation.overallPassed && qualityValidation.eligibleForFreeRetry) {
        return {
          shouldRetry: true,
          isFreeRetry: true,
          reason: 'Automatic retry due to quality validation failure',
          failureCategory: 'quality_validation',
          maxRetriesReached: false,
        };
      }

      return {
        shouldRetry: false,
        isFreeRetry: false,
        reason: 'No retry needed or not eligible',
        failureCategory: beatGen.failure_category || 'other',
        maxRetriesReached: false,
      };
    } catch (error) {
      logger.error('Error evaluating retry eligibility', { beatGenerationId, error });
      return {
        shouldRetry: false,
        isFreeRetry: false,
        reason: 'Error during evaluation',
        failureCategory: 'other',
        maxRetriesReached: false,
      };
    }
  }

  private async getRetryCount(beatGenerationId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('beat_generations')
        .select('id')
        .eq('previous_generation_id', beatGenerationId);

      if (error) {
        logger.error('Error fetching retry count', { error });
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      logger.error('Error in getRetryCount', { error });
      return 0;
    }
  }

  private categorizeError(error: Error): 'api_error' | 'timeout' | 'other' {
    const message = error.message.toLowerCase();

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }

    if (
      message.includes('api') ||
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('500')
    ) {
      return 'api_error';
    }

    return 'other';
  }
}

export const retryService = new RetryService();
