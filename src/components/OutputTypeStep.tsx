import { useState } from 'react';
import { Video, Image as ImageIcon, Wand2, Clock, Zap } from 'lucide-react';

interface OutputTypeStepProps {
  onComplete: (data: { outputType: 'video' | 'static'; advancedMode?: boolean }) => void;
  initialOutputType?: 'video' | 'static';
}

export function OutputTypeStep({ onComplete, initialOutputType }: OutputTypeStepProps) {
  const [outputType, setOutputType] = useState<'video' | 'static' | null>(initialOutputType || null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleContinue = () => {
    if (outputType) {
      onComplete({ outputType });
    }
  };

  const handleAdvancedMode = () => {
    onComplete({ outputType: 'video', advancedMode: true });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Choose Your Output Type
        </h2>
        <p className="text-slate-400">
          Select whether you want to create video ads or static images
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setOutputType('video')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            outputType === 'video'
              ? 'border-blue-500 bg-blue-950 bg-opacity-30 shadow-lg shadow-blue-500/20'
              : 'border-slate-700 bg-slate-900 hover:border-slate-600'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-blue-400" />
            </div>
            {outputType === 'video' && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            Video Ads
          </h3>
          <p className="text-slate-400 mb-4">
            Create engaging video advertisements with AI-generated footage, voiceovers, and dynamic content
          </p>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Preview: 8-10s clips (1 credit each)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Video className="w-4 h-4 text-blue-400" />
              <span>Final: 20-24s videos (3 credits each)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>Full voiceover and music</span>
            </div>
          </div>

          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>AI-generated video footage</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Professional voiceover narration</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Text overlays and brand elements</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Platform-optimized formats</span>
            </li>
          </ul>
        </button>

        <button
          onClick={() => setOutputType('static')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            outputType === 'static'
              ? 'border-green-500 bg-green-950 bg-opacity-30 shadow-lg shadow-green-500/20'
              : 'border-slate-700 bg-slate-900 hover:border-slate-600'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-green-400" />
            </div>
            {outputType === 'static' && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            Static Images
          </h3>
          <p className="text-slate-400 mb-4">
            Generate instant static advertisement images perfect for social media and display ads
          </p>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Zap className="w-4 h-4 text-green-400" />
              <span>Instant generation (no waiting)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <ImageIcon className="w-4 h-4 text-green-400" />
              <span>3 image variants per concept (5 credits)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Zap className="w-4 h-4 text-green-400" />
              <span>Multiple aspect ratios available</span>
            </div>
          </div>

          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>AI-generated product visuals</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Professional text overlays</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Ready-to-use downloads</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Perfect for social media ads</span>
            </li>
          </ul>
        </button>
      </div>

      <div className="border-t border-slate-800 pt-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Wand2 className="w-5 h-5 text-purple-400" />
            <div className="text-left">
              <h4 className="text-white font-semibold">Advanced Mode (Prompt Builder)</h4>
              <p className="text-sm text-slate-400">Full control with manual prompt creation</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 bg-purple-950 bg-opacity-30 border border-purple-800 rounded-lg animate-fadeIn">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wand2 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h5 className="text-white font-semibold mb-1">What is Advanced Mode?</h5>
                <p className="text-sm text-slate-300">
                  Build videos from scratch with complete control over script, timing, overlays, and assets.
                  Perfect for experienced creators who want pixel-perfect results.
                </p>
              </div>
            </div>

            <div className="bg-yellow-950 bg-opacity-30 border border-yellow-800 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-yellow-200">
                  <span className="font-semibold">Higher token usage:</span> Advanced mode requires more credits due to manual configuration and processing
                </p>
              </div>
            </div>

            <button
              onClick={handleAdvancedMode}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Wand2 size={20} />
              Go to Advanced Mode
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          disabled={!outputType}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors text-lg"
        >
          Continue to Creation Mode
        </button>
      </div>

      <div className="text-center">
        <p className="text-sm text-slate-500">
          You can go back anytime to change your selection
        </p>
      </div>
    </div>
  );
}
