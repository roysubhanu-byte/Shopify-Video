import { useState } from 'react';
import { Sparkles, Edit3, AlertCircle, ArrowRight } from 'lucide-react';
import { FrameworkSelector } from './FrameworkSelector';

interface CreationModeStepProps {
  productData: any;
  outputType: 'video' | 'static';
  onComplete: (data: {
    creationMode: 'automated' | 'manual';
    manualPrompt?: string;
    framework?: string;
  }) => void;
}

export function CreationModeStep({ productData, outputType, onComplete }: CreationModeStepProps) {
  const [creationMode, setCreationMode] = useState<'automated' | 'manual'>('automated');
  const [manualPrompt, setManualPrompt] = useState('');
  const [framework, setFramework] = useState<string | undefined>();
  const [showFrameworkSelector, setShowFrameworkSelector] = useState(false);

  const isManualPromptValid = () => {
    if (creationMode === 'automated') return true;
    const trimmed = manualPrompt.trim();
    return trimmed.length >= 10 && trimmed.length <= 500;
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleContinue = () => {
    if (creationMode === 'automated') {
      onComplete({ creationMode });
      return;
    }

    // Manual mode - validate prompt
    if (!isManualPromptValid()) {
      return;
    }

    // Show framework selector if not already selected
    if (!framework) {
      setShowFrameworkSelector(true);
      return;
    }

    // All validation passed, complete
    onComplete({
      creationMode,
      manualPrompt: manualPrompt.trim(),
      framework,
    });
  };

  const handleFrameworkSelect = (selectedFramework: string) => {
    setFramework(selectedFramework);
  };

  const handleFrameworkConfirm = () => {
    if (framework) {
      onComplete({
        creationMode: 'manual',
        manualPrompt: manualPrompt.trim(),
        framework,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Choose Creation Mode
        </h2>
        <p className="text-slate-400">
          Generate videos with trending hooks or describe your own concept
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setCreationMode('automated')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            creationMode === 'automated'
              ? 'border-blue-500 bg-blue-950 bg-opacity-30 shadow-lg shadow-blue-500/20'
              : 'border-slate-700 bg-slate-900 hover:border-slate-600'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            {creationMode === 'automated' && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Automated (Recommended)
          </h3>
          <p className="text-slate-400 mb-4">
            {outputType === 'video'
              ? "We'll generate 3 video concepts using proven trending hooks that perform well on social media"
              : "We'll generate 3 image concepts with trending hooks optimized for static advertisements"
            }
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>3 distinct concepts (POV, Question, Before/After)</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Based on trending hooks that stop the scroll</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{outputType === 'video' ? 'Optimized for maximum engagement' : 'Each concept gets 3 image variants (5 credits)'}</span>
            </li>
          </ul>
        </button>

        <button
          onClick={() => setCreationMode('manual')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            creationMode === 'manual'
              ? 'border-purple-500 bg-purple-950 bg-opacity-30 shadow-lg shadow-purple-500/20'
              : 'border-slate-700 bg-slate-900 hover:border-slate-600'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center">
              <Edit3 className="w-6 h-6 text-purple-400" />
            </div>
            {creationMode === 'manual' && (
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Manual (Custom)
          </h3>
          <p className="text-slate-400 mb-4">
            {outputType === 'video'
              ? "Describe your own video concept and we'll enhance it with AI-powered intelligence"
              : "Describe your own image concept and we'll generate 3 variants with professional design"
            }
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>1 custom concept tailored to your vision</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>AI enhances with product specificity</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{outputType === 'video' ? '1 credit for preview or 3 for final' : '5 credits for 3 image variants'}</span>
            </li>
          </ul>
        </button>
      </div>

      {creationMode === 'manual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fadeIn">
          <label className="block text-lg font-semibold text-white mb-3">
            Describe Your Video Concept
          </label>
          <p className="text-sm text-slate-400 mb-4">
            Tell us what you want to show in your video. Be as detailed or simple as you like - we'll handle the rest.
          </p>
          <textarea
            value={manualPrompt}
            onChange={(e) => setManualPrompt(e.target.value)}
            placeholder="e.g., Show someone enjoying my gelato on a hot summer day at an outdoor cafe"
            className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:border-transparent resize-none ${
              manualPrompt && !isManualPromptValid()
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-700 focus:ring-blue-500'
            }`}
            rows={4}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-slate-400">
              {getWordCount(manualPrompt)} words • {manualPrompt.length}/500 characters
            </span>
            {manualPrompt && !isManualPromptValid() && (
              <span className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {manualPrompt.trim().length < 10 ? 'Too short (min 10 chars)' : 'Too long (max 500 chars)'}
              </span>
            )}
          </div>
          <div className="mt-4 p-4 bg-blue-950 border border-blue-800 rounded-lg">
            <p className="text-sm text-blue-300 font-medium mb-2">
              What we'll add automatically:
            </p>
            <ul className="space-y-1 text-sm text-blue-200">
              <li>• Product-specific visual requirements</li>
              <li>• Regional character and setting details</li>
              <li>• Text overlay instructions and placement</li>
              <li>• Brand tone and style guidelines</li>
              <li>• Professional camera work and lighting</li>
            </ul>
          </div>
        </div>
      )}

      {showFrameworkSelector && creationMode === 'manual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <FrameworkSelector
            productData={productData}
            selectedFramework={framework}
            onSelect={handleFrameworkSelect}
          />
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={showFrameworkSelector && framework ? handleFrameworkConfirm : handleContinue}
          disabled={creationMode === 'manual' && !isManualPromptValid()}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors text-lg flex items-center gap-2"
        >
          {showFrameworkSelector && framework ? (
            <>
              Confirm & Continue
              <ArrowRight size={20} />
            </>
          ) : creationMode === 'automated' ? (
            'Continue to Hooks'
          ) : (
            <>
              Choose Story Framework
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
