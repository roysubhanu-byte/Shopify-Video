import { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { reshootBeat } from '../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  beatGenerationId: string;
  beatNumber: number;
  currentQualityScore?: number;
  userCredits: number;
  onReshootSuccess: (newBeatGenerationId: string, creditsRemaining: number) => void;
}

const RESHOOT_REASONS = [
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'wrong_product', label: 'Product Not Accurate' },
  { value: 'bad_composition', label: 'Poor Composition' },
  { value: 'text_issue', label: 'Text Overlay Problem' },
  { value: 'creative_direction', label: 'Creative Direction' },
  { value: 'other', label: 'Other' },
];

export function ReshootDialog({
  isOpen,
  onClose,
  beatGenerationId,
  beatNumber,
  currentQualityScore,
  userCredits,
  onReshootSuccess,
}: Props) {
  const [reasonCategory, setReasonCategory] = useState<string>('quality_issue');
  const [reason, setReason] = useState('');
  const [isReshooting, setIsReshooting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Please provide a reason for reshoot');
      return;
    }

    if (userCredits < 1) {
      setError('Insufficient credits. You need 1 credit to reshoot this beat.');
      return;
    }

    setIsReshooting(true);
    setError(null);

    try {
      const result = await reshootBeat({
        variantId: beatGenerationId,
        beatNumber: beatNumber,
        userId: 'temp-user',
      });

      onReshootSuccess((result as any).newBeatGenerationId, (result as any).creditsRemaining);
      onClose();
      setReason('');
      setReasonCategory('quality_issue');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reshoot beat');
    } finally {
      setIsReshooting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Reshoot Beat {beatNumber}</h2>
              <p className="text-sm text-slate-400 mt-1">
                Regenerate this beat with the same settings
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isReshooting}
              className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {currentQualityScore !== undefined && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-300 mb-1">Current Quality Score</div>
                <div className="text-2xl font-bold text-white">{currentQualityScore}/100</div>
              </div>
            )}

            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 flex gap-3">
              <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200">
                <div className="font-medium mb-1">Credit Cost: 1 Credit</div>
                <div className="text-yellow-300/80">
                  You have {userCredits} credit{userCredits !== 1 ? 's' : ''} available
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Reason Category
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                disabled={isReshooting}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {RESHOOT_REASONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Detailed Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isReshooting}
                placeholder="Describe what needs to be improved (e.g., 'Product is not visible enough', 'Text overlay is hard to read')..."
                rows={4}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                This helps us improve the system and track reshoot patterns
              </p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isReshooting}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isReshooting || userCredits < 1 || !reason.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isReshooting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Reshooting...
                  </>
                ) : (
                  <>Reshoot Beat (1 Credit)</>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="text-sm font-medium text-white mb-2">What happens next?</h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Beat will be regenerated with the same prompt and settings</li>
              <li>• Quality validation will run automatically</li>
              <li>• You'll be notified when the new beat is ready</li>
              <li>• Original beat will remain available for comparison</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
