import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface VideoGenerationProgressProps {
  runId: string;
  variantLabel: string;
  onComplete?: (videoUrl: string) => void;
  onError?: (error: string) => void;
}

type GenerationState = 'queued' | 'running' | 'completed' | 'failed';

interface JobStatus {
  state: GenerationState;
  progress?: number;
  videoUrl?: string;
  error?: string;
  estimatedTime?: number;
}

export default function VideoGenerationProgress({
  runId,
  variantLabel,
  onComplete,
  onError,
}: VideoGenerationProgressProps) {
  const [status, setStatus] = useState<JobStatus>({ state: 'queued' });
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let timeIntervalId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/render/status/${runId}`);
        if (!response.ok) throw new Error('Failed to fetch status');

        const data = await response.json();
        setStatus(data);

        if (data.state === 'completed' && data.videoUrl) {
          clearInterval(intervalId);
          clearInterval(timeIntervalId);
          onComplete?.(data.videoUrl);
        } else if (data.state === 'failed') {
          clearInterval(intervalId);
          clearInterval(timeIntervalId);
          onError?.(data.error || 'Video generation failed');
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    };

    pollStatus();
    intervalId = setInterval(pollStatus, 3000);

    timeIntervalId = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(timeIntervalId);
    };
  }, [runId, onComplete, onError]);

  const getStateIcon = () => {
    switch (status.state) {
      case 'queued':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStateText = () => {
    switch (status.state) {
      case 'queued':
        return 'Queued';
      case 'running':
        return 'Generating';
      case 'completed':
        return 'Complete';
      case 'failed':
        return 'Failed';
    }
  };

  const getStateColor = () => {
    switch (status.state) {
      case 'queued':
        return 'bg-blue-50 border-blue-200';
      case 'running':
        return 'bg-blue-50 border-blue-300';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = status.progress || (status.state === 'running' ? 50 : status.state === 'completed' ? 100 : 0);

  return (
    <div className={`border-2 rounded-lg p-4 ${getStateColor()} transition-all`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">{getStateIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{variantLabel}</h4>
            <span className="text-xs font-medium text-gray-600">{getStateText()}</span>
          </div>

          {status.state === 'running' && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Elapsed: {formatTime(elapsedTime)}</span>
                {status.estimatedTime && (
                  <span>Est. remaining: {formatTime(Math.max(0, status.estimatedTime - elapsedTime))}</span>
                )}
              </div>
            </>
          )}

          {status.state === 'queued' && (
            <p className="text-sm text-gray-600">Waiting for processing to begin...</p>
          )}

          {status.state === 'completed' && (
            <p className="text-sm text-green-700">Video generated successfully in {formatTime(elapsedTime)}</p>
          )}

          {status.state === 'failed' && (
            <p className="text-sm text-red-700">{status.error || 'An error occurred during generation'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
