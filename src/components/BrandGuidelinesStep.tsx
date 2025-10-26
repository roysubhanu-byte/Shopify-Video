import { useState } from 'react';
import { Palette, Globe } from 'lucide-react';

interface BrandGuidelinesStepProps {
  onComplete: (data: { brandTonePrompt: string; targetMarket: string }) => void;
  initialBrandTone?: string;
  initialTargetMarket?: string;
}

const TARGET_MARKETS = [
  { value: 'Global', label: 'Global', description: 'Universal appeal for worldwide audience' },
  { value: 'USA', label: 'USA', description: 'American audience and lifestyle' },
  { value: 'India', label: 'India', description: 'Indian audience with cultural context' },
  { value: 'Europe', label: 'Europe', description: 'European audience and aesthetic' },
  { value: 'Middle East', label: 'Middle East', description: 'Middle Eastern audience with cultural sensitivity' },
];

export function BrandGuidelinesStep({ onComplete, initialBrandTone = '', initialTargetMarket = 'Global' }: BrandGuidelinesStepProps) {
  const [brandTonePrompt, setBrandTonePrompt] = useState(initialBrandTone);
  const [targetMarket, setTargetMarket] = useState(initialTargetMarket);

  const handleContinue = () => {
    onComplete({
      brandTonePrompt: brandTonePrompt.trim(),
      targetMarket,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Brand Guidelines
        </h2>
        <p className="text-slate-400">
          Help us understand your brand personality and target audience
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-5 h-5 text-blue-500" />
            <label className="text-lg font-semibold text-white">
              Brand Tone & Style
            </label>
          </div>
          <p className="text-sm text-slate-400 mb-3">
            Describe your brand personality (optional but recommended)
          </p>
          <textarea
            value={brandTonePrompt}
            onChange={(e) => setBrandTonePrompt(e.target.value)}
            placeholder="e.g., Premium and authentic with artisanal craftsmanship. Warm, inviting, and family-friendly..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={300}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-slate-500">
              {brandTonePrompt.length}/300 characters
            </span>
            {!brandTonePrompt && (
              <span className="text-xs text-slate-500">
                Leave blank to use auto-detected style
              </span>
            )}
          </div>
          {brandTonePrompt && (
            <div className="mt-3 p-3 bg-blue-950 border border-blue-800 rounded-lg">
              <p className="text-sm text-blue-300">
                This will be woven into your video prompts to maintain consistent brand personality
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-green-500" />
            <label className="text-lg font-semibold text-white">
              Target Market
            </label>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Select your primary audience for regional customization
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TARGET_MARKETS.map((market) => (
              <button
                key={market.value}
                onClick={() => setTargetMarket(market.value)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  targetMarket === market.value
                    ? 'border-green-500 bg-green-950 bg-opacity-30'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">
                      {market.label}
                    </div>
                    <div className="text-sm text-slate-400">
                      {market.description}
                    </div>
                  </div>
                  {targetMarket === market.value && (
                    <div className="ml-2 flex-shrink-0">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 bg-slate-800 border border-slate-700 rounded-lg">
            <p className="text-sm text-slate-300">
              <span className="font-semibold">Selected: {targetMarket}</span>
              <span className="text-slate-400"> - Videos will feature characters, settings, and cultural context appropriate for this audience</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors text-lg"
        >
          Continue to Creation Type
        </button>
      </div>

      <div className="text-center">
        <p className="text-sm text-slate-500">
          These settings will be saved with your project and applied to all video concepts
        </p>
      </div>
    </div>
  );
}
