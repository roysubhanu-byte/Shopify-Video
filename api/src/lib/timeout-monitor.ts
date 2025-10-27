import { Logger } from './logger';
import { supabase } from './supabase';

const logger = new Logger({ module: 'timeout-monitor' });

export interface TimeoutConfig {
  previewTimeoutMs: number;
  finalTimeoutMs: number;
  checkIntervalMs: number;
  gracePeriodMs: number;
}

export interface TimeoutAction {
  runId: string;
  variantId: string;
  action: 'retry' | 'refund' | 'mark_failed';
  reason: string;
  creditsToRefund?: number;
}

export class TimeoutMonitor {
  private config: TimeoutConfig = {
    previewTimeoutMs: 10 * 60 * 1000,
    finalTimeoutMs: 20 * 60 * 1000,
    checkIntervalMs: 60 * 1000,
    gracePeriodMs: 2 * 60 * 1000,
  };

  private monitoringInterval: NodeJS.Timeout | null = null;

  startMonitoring(): void {
    if (this.monitoringInterval) {
      logger.warn('Timeout monitoring already running');
      return;
    }

    logger.info('Starting timeout monitoring', {
      previewTimeout: this.config.previewTimeoutMs / 1000 + 's',
      finalTimeout: this.config.finalTimeoutMs / 1000 + 's',
      checkInterval: this.config.checkIntervalMs / 1000 + 's',
    });

    this.monitoringInterval = setInterval(
      () => this.checkForTimeouts(),
      this.config.checkIntervalMs
    );
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Timeout monitoring stopped');
    }
  }

  private async checkForTimeouts(): Promise<void> {
    try {
      logger.debug('Checking for timed out runs');

      const timedOutRuns = await this.findTimedOutRuns();

      logger.info('Timeout check complete', {
        timedOutCount: timedOutRuns.length,
      });

      for (const run of timedOutRuns) {
        await this.handleTimeout(run);
      }
    } catch (error) {
      logger.error('Error checking for timeouts', { error });
    }
  }

  private async findTimedOutRuns(): Promise<Array<{
    id: string;
    variant_id: string;
    engine: string;
    state: string;
    created_at: string;
    request_json: any;
  }>> {
    const previewCutoff = new Date(Date.now() - this.config.previewTimeoutMs).toISOString();
    const finalCutoff = new Date(Date.now() - this.config.finalTimeoutMs).toISOString();

    const { data: previewTimeouts, error: previewError } = await supabase
      .from('runs')
      .select('*')
      .in('state', ['queued', 'running'])
      .eq('engine', 'veo_fast')
      .lt('created_at', previewCutoff)
      .or('request_json->>duration.eq.9,request_json->>duration.is.null');

    if (previewError) {
      logger.error('Error fetching preview timeouts', { error: previewError });
    }

    const { data: finalTimeouts, error: finalError } = await supabase
      .from('runs')
      .select('*')
      .in('state', ['queued', 'running'])
      .eq('engine', 'veo_fast')
      .lt('created_at', finalCutoff)
      .eq('request_json->>duration', '24');

    if (finalError) {
      logger.error('Error fetching final timeouts', { error: finalError });
    }

    return [...(previewTimeouts || []), ...(finalTimeouts || [])];
  }

  private async handleTimeout(run: {
    id: string;
    variant_id: string;
    engine: string;
    state: string;
    created_at: string;
    request_json: any;
  }): Promise<void> {
    logger.warn('Handling timed out run', {
      runId: run.id,
      variantId: run.variant_id,
      state: run.state,
      age: Math.round((Date.now() - new Date(run.created_at).getTime()) / 1000 / 60) + ' minutes',
    });

    const isFinal = run.request_json?.duration === 24;
    const retryCount = await this.getRetryCount(run.id);

    let action: TimeoutAction;

    if (retryCount === 0 && !isFinal) {
      action = {
        runId: run.id,
        variantId: run.variant_id,
        action: 'retry',
        reason: 'First timeout on preview generation',
      };
    } else if (isFinal) {
      action = {
        runId: run.id,
        variantId: run.variant_id,
        action: 'refund',
        reason: 'Final generation timed out',
        creditsToRefund: 1,
      };
    } else {
      action = {
        runId: run.id,
        variantId: run.variant_id,
        action: 'mark_failed',
        reason: 'Exceeded retry limit after timeout',
      };
    }

    await this.executeAction(action);
  }

  private async executeAction(action: TimeoutAction): Promise<void> {
    logger.info('Executing timeout action', action);

    try {
      await supabase
        .from('runs')
        .update({
          state: 'failed',
          response_json: {
            error: 'Generation timed out',
            timeout_action: action.action,
            timeout_reason: action.reason,
          },
        })
        .eq('id', action.runId);

      await supabase
        .from('variants')
        .update({
          status: 'error',
        })
        .eq('id', action.variantId);

      if (action.action === 'refund' && action.creditsToRefund) {
        await this.refundCredits(action.variantId, action.creditsToRefund, action.reason);
      }

      if (action.action === 'retry') {
        logger.info('Retry action logged - manual restart required', {
          runId: action.runId,
          variantId: action.variantId,
        });
      }

      logger.info('Timeout action executed successfully', action);
    } catch (error) {
      logger.error('Error executing timeout action', { action, error });
    }
  }

  private async refundCredits(
    variantId: string,
    credits: number,
    reason: string
  ): Promise<void> {
    logger.info('Refunding credits for timeout', {
      variantId,
      credits,
      reason,
    });

    try {
      const { data: variant } = await supabase
        .from('variants')
        .select('project_id')
        .eq('id', variantId)
        .maybeSingle();

      if (!variant) {
        logger.error('Variant not found for refund', { variantId });
        return;
      }

      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', variant.project_id)
        .maybeSingle();

      if (!project) {
        logger.error('Project not found for refund', { projectId: variant.project_id });
        return;
      }

      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: project.user_id,
          amount: credits,
          transaction_type: 'refund',
          description: `Refund: ${reason}`,
          project_id: variant.project_id,
          variant_id: variantId,
        });

      if (transactionError) {
        logger.error('Error creating credit refund transaction', {
          error: transactionError,
          userId: project.user_id,
          credits,
        });
        return;
      }

      logger.info('Credits refunded successfully', {
        userId: project.user_id,
        credits,
        reason,
      });
    } catch (error) {
      logger.error('Error in refund process', { error, variantId, credits });
    }
  }

  private async getRetryCount(runId: string): Promise<number> {
    const { data, error } = await supabase
      .from('runs')
      .select('id')
      .eq('response_json->>retryOf', runId);

    if (error) {
      logger.error('Error getting retry count', { error, runId });
      return 0;
    }

    return data?.length || 0;
  }

  async checkRunTimeout(runId: string): Promise<{
    isTimedOut: boolean;
    runningTimeMs: number;
    timeoutThresholdMs: number;
  }> {
    const { data: run, error } = await supabase
      .from('runs')
      .select('created_at, request_json')
      .eq('id', runId)
      .maybeSingle();

    if (error || !run) {
      return {
        isTimedOut: false,
        runningTimeMs: 0,
        timeoutThresholdMs: 0,
      };
    }

    const runningTimeMs = Date.now() - new Date(run.created_at).getTime();
    const isFinal = run.request_json?.duration === 24;
    const timeoutThresholdMs = isFinal ? this.config.finalTimeoutMs : this.config.previewTimeoutMs;

    return {
      isTimedOut: runningTimeMs > timeoutThresholdMs,
      runningTimeMs,
      timeoutThresholdMs,
    };
  }
}

export const timeoutMonitor = new TimeoutMonitor();
