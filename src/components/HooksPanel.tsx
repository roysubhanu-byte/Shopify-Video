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
    setLoading(true);
    try {
      const response = await fetch(`/api/hooks?vertical=${vertical}&limit=10`);
      const data = await response.json();
      if (data.hooks) {
        setHooks(data.hooks);
      }
    } catch (error) {
      console.error('Failed to fetch hooks:', error);
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Trending Hooks</h3>
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
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {hook.template}: {hook.example.length > 30 ? hook.example.substring(0, 30) + '...' : hook.example}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Hook for Concept A (optional)
              </label>
              <input
                type="text"
                value={customHookA}
                onChange={(e) => setCustomHookA(e.target.value)}
                placeholder="Enter custom hook (≤6 words)"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !isValidHook(customHookA) ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-sm ${
                  !isValidHook(customHookA) ? 'text-red-600 font-medium' : 'text-gray-500'
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Hook for Concept B (optional)
              </label>
              <input
                type="text"
                value={customHookB}
                onChange={(e) => setCustomHookB(e.target.value)}
                placeholder="Enter custom hook (≤6 words)"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !isValidHook(customHookB) ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-sm ${
                  !isValidHook(customHookB) ? 'text-red-600 font-medium' : 'text-gray-500'
                }`}>
                  {getWordCount(customHookB)}/6 words
                </span>
                {!isValidHook(customHookB) && (
                  <span className="flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Exceeds 6 words
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Hook for Concept C (optional)
              </label>
              <input
                type="text"
                value={customHookC}
                onChange={(e) => setCustomHookC(e.target.value)}
                placeholder="Enter custom hook (≤6 words)"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !isValidHook(customHookC) ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-sm ${
                  !isValidHook(customHookC) ? 'text-red-600 font-medium' : 'text-gray-500'
                }`}>
                  {getWordCount(customHookC)}/6 words
                </span>
                {!isValidHook(customHookC) && (
                  <span className="flex items-center gap-1 text-red-600 text-sm">
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
