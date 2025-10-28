// src/components/HooksPanel.tsx
import { useEffect, useState } from 'react';
import { API_URL } from '../lib/config';

type HookTemplate = {
  id: string;
  label: string;
  filled_text: string;
  vertical?: string;
};

export function HooksPanel({
  vertical = 'general',
  onCustomHooksChange,
}: {
  vertical?: string;
  onCustomHooksChange: (v: { A?: string; B?: string; C?: string }) => void;
}) {
  const [hooks, setHooks] = useState<HookTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customA, setCustomA] = useState('');
  const [customB, setCustomB] = useState('');
  const [customC, setCustomC] = useState('');

  // keep parent informed
  useEffect(() => {
    onCustomHooksChange({
      A: customA || undefined,
      B: customB || undefined,
      C: customC || undefined,
    });
  }, [customA, customB, customC, onCustomHooksChange]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_URL}/api/hooks?vertical=${encodeURIComponent(vertical)}`;
        const res = await fetch(url, { credentials: 'include' });

        if (!res.ok) {
          // try to parse JSON error; fall back to status text
          let msg = `Failed to fetch hooks (${res.status})`;
          try {
            const j = await res.json();
            msg = j?.error || msg;
          } catch {
            /* ignore parse */
          }
          throw new Error(msg);
        }

        // must be JSON; if it isn't, parsing will throw and we fall back
        const data = await res.json();
        const items: HookTemplate[] = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];

        if (!aborted) setHooks(items);
      } catch (e) {
        if (!aborted) {
          console.warn('Failed to fetch hooks, using defaults:', e);
          setError(e instanceof Error ? e.message : 'Failed to load hooks');

          // sensible defaults shown in your screenshots
          setHooks([
            { id: 'fallback-1', label: 'POV',        filled_text: 'POV: You finally found the perfect {{product}}.' },
            { id: 'fallback-2', label: 'Question',   filled_text: 'Question: What if {{benefit}} changed everything?' },
            { id: 'fallback-3', label: 'Before/After', filled_text: 'Before: {{problem}} → After: {{result}}.' },
            { id: 'fallback-4', label: 'Stop doing', filled_text: 'Stop doing {{mundane_task}}. Do this instead.' },
            { id: 'fallback-5', label: 'Did you know', filled_text: 'Did you know most people skip {{step}} and lose out?' },
            { id: 'fallback-6', label: 'This is your sign', filled_text: 'This is your sign: try {{product}} today.' },
            { id: 'fallback-7', label: 'The secret', filled_text: 'The secret to better {{result}} in half the time.' },
            { id: 'fallback-8', label: 'If you struggle', filled_text: 'If you struggle with {{pain_point}}, this changes everything.' },
            { id: 'fallback-9', label: 'Everyone is obsessed', filled_text: 'Everyone is obsessed with this simple {{product}} upgrade.' },
          ]);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [vertical]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-200 font-semibold">Trending Hooks</h3>
          {error && (
            <span className="text-xs text-amber-400">
              Using default hooks (server connection failed)
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {hooks.map((h) => (
            <span key={h.id} className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm">
              {h.label ? `${h.label}: ` : ''}{h.filled_text}
            </span>
          ))}
        </div>

        <hr className="border-slate-800 my-5" />

        <div className="space-y-3">
          <label className="block text-sm text-slate-400">Custom Hook for Concept A (optional)</label>
          <input value={customA} onChange={(e) => setCustomA(e.target.value)}
                 placeholder="Try something that actually works"
                 className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white" />

          <label className="block text-sm text-slate-400">Custom Hook for Concept B (optional)</label>
          <input value={customB} onChange={(e) => setCustomB(e.target.value)}
                 placeholder="Better results in half the time"
                 className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white" />

          <label className="block text-sm text-slate-400">Custom Hook for Concept C (optional)</label>
          <input value={customC} onChange={(e) => setCustomC(e.target.value)}
                 placeholder="Stop wasting money on this"
                 className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white" />
        </div>
      </div>
    </div>
  );
}
