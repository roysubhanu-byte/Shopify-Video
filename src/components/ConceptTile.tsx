import { Play, Loader2, CheckCircle2, Sparkles, Copy, RefreshCw } from 'lucide-react';
import type { VariantPlan, VariantRender } from '../types/api';

interface ConceptTileProps {
  variant: VariantPlan;
  render?: VariantRender;
  onPlay?: () => void;
  onFinalize?: () => void;
  onSwapHook?: () => void;
  onDuplicate?: () => void;
  isFinalized?: boolean;
}

export function ConceptTile({
  variant,
  render,
  onPlay,
  onFinalize,
  onSwapHook,
  onDuplicate,
  isFinalized
}: ConceptTileProps) {
  const isLoading = render?.status === 'queued' || render?.status === 'running';
  const hasVideo = render?.status === 'succeeded' && render?.videoUrl;

  const conceptColors = {
    A: 'from-cyan-500 to-blue-500',
    B: 'from-orange-500 to-pink-500',
    C: 'from-green-500 to-teal-500',
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-all">
      <div className={`h-2 bg-gradient-to-r ${conceptColors[variant.label]}`} />

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${conceptColors[variant.label]} flex items-center justify-center text-white font-bold text-lg`}>
              {variant.label}
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                {variant.conceptType}
              </div>
              <div className="text-xs text-slate-500">
                Seed: {variant.seed}
              </div>
            </div>
          </div>

          {render?.status === 'succeeded' && (
            <CheckCircle2 size={20} className="text-green-500" />
          )}
        </div>

        <p className="text-white text-lg font-medium mb-4 min-h-[3rem]">
          {variant.hook}
        </p>

        {hasVideo ? (
          <button
            onClick={onPlay}
            className="w-full aspect-[9/16] bg-slate-900 rounded-lg flex items-center justify-center group overflow-hidden relative"
          >
            {render.thumbnailUrl && (
              <img
                src={render.thumbnailUrl}
                alt="Video thumbnail"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
            <Play size={48} className="text-white relative z-10 group-hover:scale-110 transition-transform" />
          </button>
        ) : isLoading ? (
          <div className="w-full aspect-[9/16] bg-slate-900 rounded-lg flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="text-blue-500 animate-spin" />
            <span className="text-slate-400 text-sm">
              {render?.status === 'queued' ? 'Queued...' : 'Rendering...'}
            </span>
          </div>
        ) : (
          <div className="w-full aspect-[9/16] bg-slate-900 rounded-lg flex items-center justify-center">
            <div className="text-center text-slate-500">
              <Play size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Preview not rendered</p>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <div className="text-xs text-slate-400">
            {variant.beats.length} beats · {variant.beats.reduce((sum, b) => sum + b.duration, 0)}s
          </div>

          {hasVideo && !isFinalized && (
            <div className="flex gap-2 pt-2">
              {onFinalize && (
                <button
                  onClick={onFinalize}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Sparkles size={14} />
                  Finalize
                </button>
              )}
            </div>
          )}

          {!isFinalized && (
            <div className="flex gap-2">
              {onSwapHook && (
                <button
                  onClick={onSwapHook}
                  className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  title="Generate new hook with same concept"
                >
                  <RefreshCw size={14} />
                  Swap Hook
                </button>
              )}
              {onDuplicate && (
                <button
                  onClick={onDuplicate}
                  className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  title="Duplicate with new seed"
                >
                  <Copy size={14} />
                  Duplicate
                </button>
              )}
            </div>
          )}

          {isFinalized && (
            <div className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
              <p className="text-xs text-green-400 font-medium">Final Render Complete</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
