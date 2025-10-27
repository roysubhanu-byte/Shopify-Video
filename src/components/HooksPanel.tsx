import { useState, useEffect } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface Hook {
  template: string;
  example: string;
  vertical?: string;
  performance?: number;
}

interface HooksPanelProps {
  vertical?: string;
  onCustomHooksChange?: (hooks: { A?: string; B?: string; C?: string }) => void;
}

export function HooksPanel({ vertical = 'general', onCustomHooksChange }: HooksPanelProps) {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customHookA, setCustomHookA] = useState('');
  const [customHookB, setCustomHookB] = useState('');
  const [customHookC, setCustomHookC] = useState('');
  const [selectedHook, setSelectedHook] = useState<string | null>(null);

  useEffect(() => {
    fetchHooks();
  }, [vertical]);

  useEffect(() => {
    if (onCustomHooksChange) {
      onCustomHooksChange({
        A: customHookA || undefined,
        B: customHookB || undefined,
        C: customHookC || undefined,
      });
    }
  }, [customHookA, customHookB, customHookC, onCustomHooksChange]);

  const fetchHooks = async () => {
    const defaultHooks: Hook[] = [
      { template: 'POV', example: 'You finally found the perfect solution', vertical: 'general', performance: 0.85 },
      { template: 'Question', example: 'What if this changed everything?', vertical: 'general', performance: 0.87 },
      { template: 'Before/After', example: 'Before: chaos. After: calm', vertical: 'general', performance: 0.93 },
      { template: 'POV', example: 'Your morning routine got easier', vertical: 'lifestyle', performance: 0.91 },
      { template: 'Stop doing', example: 'Stop wasting money on this', vertical: 'general', performance: 0.80 },
      { template: 'Did you know', example: 'Most people skip this step', vertical: 'general', performance: 0.77 },
      { template: 'This is your sign', example: 'Try something that actually works', vertical: 'general', performance: 0.75 },
      { template: 'The secret to', example: 'Better results in half the time', vertical: 'general', performance: 0.88 },
      { template: 'If you struggle with', example: 'This changes everything', vertical: 'general', performance: 0.82 },
      { template: 'Everyone is obsessed', example: 'This simple upgrade', vertical: 'lifestyle', performance: 0.81 },
    ];

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/hooks?vertical=${vertical}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch hooks from server');
      }
      const data = await response.json();
      if (data.hooks && data.hooks.length > 0) {
        setHooks(data.hooks);
        setError(null);
      } else {
        setHooks(defaultHooks);
      }
    } catch (error) {
      console.error('Failed to fetch hooks, using defaults:', error);
      setError('Using default hooks (server connection failed)');
      setHooks(defaultHooks);
    } finally {
      setLoading(false);
    }
  };

  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const isValidHook = (text: string): boolean => {
    if (!text) return true;
    return getWordCount(text) <= 6;
  };

  const handleChipClick = (hookExample: string) => {
    setSelectedHook(hookExample);
    if (!customHookA) setCustomHookA(hookExample);
    else if (!customHookB) setCustomHookB(hookExample);
    else if (!customHookC) setCustomHookC(hookExample);
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-white">Trending Hooks</h3>
        {error && (
          <span className="ml-auto text-xs text-yellow-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {hooks.map((hook, index) => (
              <button
                key={index}
                onClick={() => handleChipClick(hook.example)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  selectedHook === hook.example
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {hook.template}: {hook.example.length > 30 ? hook.example.substring(0, 30) + '...' : hook.example}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="border-t border-slate-800 pt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Custom Hook for Concept A (optional)
              </label>
              <input
                type="text"
                value={customHookA}
                onChange={(e) => setCustomHookA(e.target.value)}
                placeholder="Enter custom hook (≤6 words)"
                className={`w-full px-4 py-2 border rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !isValidHook(customHookA) ? 'border-red-500' : 'border-slate-700'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-sm ${
                  !isValidHook(customHookA) ? 'text-red-400 font-medium' : 'text-slate-500'
                }`}>
                  {getWordCount(customHookA)}/6 words
                </span>
                {!isValidHook(customHookA) && (
                  <span className="flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Exceeds 6 words
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Custom Hook for Concept B (optional)
              </label>
              <input
                type="text"
                value={customHookB}
                onChange={(e) => setCustomHookB(e.target.value)}
                placeholder="Enter custom hook (≤6 words)"
                className={`w-full px-4 py-2 border rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !isValidHook(customHookB) ? 'border-red-500' : 'border-slate-700'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-sm ${
                  !isValidHook(customHookB) ? 'text-red-400 font-medium' : 'text-slate-500'
                }`}>
                  {getWordCount(customHookB)}/6 words
                </span>
                {!isValidHook(customHookB) && (
                  <span className="flex items-center gap-1 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Exceeds 6 words
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Custom Hook for Concept C (optional)
              </label>
              <input
                type="text"
                value={customHookC}
                onChange={(e) => setCustomHookC(e.target.value)}
                placeholder="Enter custom hook (≤6 words)"
                className={`w-full px-4 py-2 border rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !isValidHook(customHookC) ? 'border-red-500' : 'border-slate-700'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-sm ${
                  !isValidHook(customHookC) ? 'text-red-400 font-medium' : 'text-slate-500'
                }`}>
                  {getWordCount(customHookC)}/6 words
                </span>
                {!isValidHook(customHookC) && (
                  <span className="flex items-center gap-1 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Exceeds 6 words
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
