import { useState } from 'react';
import { Eye, Edit3, Check, X } from 'lucide-react';

interface PromptPreviewProps {
  originalPrompt: string;
  enhancedPrompt: string;
  framework?: string;
  category?: string;
  theme?: string;
  onConfirm: (finalPrompt: string) => void;
  onCancel: () => void;
}

export function PromptPreview({
  originalPrompt,
  enhancedPrompt,
  framework,
  category,
  theme,
  onConfirm,
  onCancel,
}: PromptPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(enhancedPrompt);
  const [showFull, setShowFull] = useState(false);

  const handleConfirm = () => {
    onConfirm(isEditing ? editedPrompt : enhancedPrompt);
  };

  const truncatedPrompt = enhancedPrompt.substring(0, 500);
  const isTruncated = enhancedPrompt.length > 500;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Enhanced Prompt Preview
              </h3>
              <p className="text-slate-400 text-sm">
                Review your AI-enhanced video concept before generating
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={24} className="text-slate-400" />
            </button>
          </div>

          {(framework || category || theme) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {framework && (
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-sm text-blue-400">
                  Framework: {framework}
                </div>
              )}
              {category && (
                <div className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-sm text-green-400">
                  Category: {category}
                </div>
              )}
              {theme && (
                <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-sm text-purple-400">
                  Theme: {theme}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold text-white">
                Your Original Concept
              </h4>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-300 whitespace-pre-wrap">{originalPrompt}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
            <span className="text-sm text-slate-500 font-medium">AI ENHANCED</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold text-white">
                Enhanced Professional Prompt
              </h4>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm text-slate-300"
              >
                {isEditing ? (
                  <>
                    <Eye size={16} />
                    Preview
                  </>
                ) : (
                  <>
                    <Edit3 size={16} />
                    Edit
                  </>
                )}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-4 text-slate-200 font-mono text-sm focus:outline-none focus:border-blue-500 min-h-[400px]"
                  placeholder="Edit the enhanced prompt..."
                />
                <p className="text-xs text-slate-500">
                  {editedPrompt.length} characters
                </p>
              </div>
            ) : (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm">
                  {showFull ? enhancedPrompt : truncatedPrompt}
                  {isTruncated && !showFull && '...'}
                </pre>
                {isTruncated && (
                  <button
                    onClick={() => setShowFull(!showFull)}
                    className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    {showFull ? 'Show Less' : 'Show Full Prompt'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              <strong>What's different?</strong> Your prompt has been enhanced with cinematic
              direction, storytelling structure, technical specifications, and regional targeting
              to ensure high-quality video generation.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-6">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Check size={20} />
              Confirm & Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
