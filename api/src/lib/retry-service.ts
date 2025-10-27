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
  recommendedSeed?: number;
  retryStrategy?: 'same_seed' | 'new_seed' | 'improved_prompt';
}

export class RetryService {
  private maxFreeRetries = 3;
  private retryDelayMs = 2000;
  private qualityThresholdForNewSeed = 60;

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
        const retryStrategy = this.determineRetryStrategy(qualityValidation, retryCount);
        const recommendedSeed = retryStrategy === 'new_seed'
          ? this.generateVariationSeed(beatGen.seed || 0, retryCount)
          : beatGen.seed || 0;

        return {
          shouldRetry: true,
          isFreeRetry: true,
          reason: `Automatic retry due to quality validation failure (score: ${qualityValidation.overallScore})`,
          failureCategory: 'quality_validation',
          maxRetriesReached: false,
          recommendedSeed,
          retryStrategy,
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

  private determineRetryStrategy(
    qualityValidation: QualityValidationSummary,
    retryCount: number
  ): 'same_seed' | 'new_seed' | 'improved_prompt' {
    const motionIssues = qualityValidation.validations.find(
      v => v.validationType === 'motion_smoothness' && !v.passed
    );
    const glitchIssues = qualityValidation.validations.find(
      v => v.validationType === 'glitch_detection' && !v.passed
    );

    if (motionIssues || glitchIssues) {
      return 'new_seed';
    }

    if (qualityValidation.overallScore < this.qualityThresholdForNewSeed) {
      return retryCount === 0 ? 'new_seed' : 'improved_prompt';
    }

    return 'same_seed';
  }

  private generateVariationSeed(originalSeed: number, retryCount: number): number {
    const variation = (retryCount + 1) * 1000;
    return originalSeed + variation;
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
