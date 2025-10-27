import { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../lib/config';

type HookTemplate = {
  id: string;
  label: string;
  filled_text: string;
  vertical?: string;
};

type Props = {
  vertical?: string;
  onCustomHooksChange: (v: { A?: string; B?: string; C?: string }) => void;
};

export function HooksPanel({ vertical = 'general', onCustomHooksChange }: Props) {
  const [hooks, setHooks] = useState<HookTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // local A/B/C overrides the user can type
  const [customA, setCustomA] = useState('');
  const [customB, setCustomB] = useState('');
  const [customC, setCustomC] = useState('');

  useEffect(() => {
    onCustomHooksChange({
      A: customA.trim() || undefined,
      B: customB.trim() || undefined,
      C: customC.trim() || undefined,
    });
  }, [customA, customB, customC, onCustomHooksChange]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // ✅ IMPORTANT: use absolute API base. Relative `/api/hooks` will hit the frontend origin and return HTML.
        const url = `${API_URL}/api/hooks?vertical=${encodeURIComponent(vertical)}`;
        const res = await fetch(url, { credentials: 'include' });

        if (!res.ok) {
          let msg = `Failed to fetch hooks (${res.status})`;
          try {
            const j = await res.json();
            msg = j?.error || j?.message || msg;
          } catch {
            // response was likely HTML (404 page) -> ignore parse
          }
          throw new Error(msg);
        }

        const data = await res.json();
        const items: HookTemplate[] = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];

        if (!cancelled) setHooks(items);
      } catch (e) {
        if (!cancelled) {
          console.warn('Failed to fetch hooks, using defaults:', e);
          setError(e instanceof Error ? e.message : 'Failed to load hooks');
          setHooks([
            { id: 'fallback-1', label: 'POV',          filled_text: 'POV: {{pain_point}} ends today' },
            { id: 'fallback-2', label: 'Question',     filled_text: 'What if {{benefit}} took 10s?' },
            { id: 'fallback-3', label: 'Before/After', filled_text: 'Before: {{problem}} → After: {{result}}' },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [vertical]);

  const topHooks = useMemo(() => hooks.slice(0, 12), [hooks]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Trending Hook Templates</h3>
          {loading && <span className="text-slate-400 text-sm">Loading…</span>}
        </div>

        {error && (
          <div className="mb-4 text-sm text-amber-300 bg-amber-900/30 border border-amber-800 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {topHooks.length === 0 ? (
          <p className="text-slate-400 text-sm">No hooks found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topHooks.map((h) => (
              <div
                key={h.id}
                className="rounded-lg border border-slate-800 bg-slate-800/50 p-3"
              >
                <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  {h.label}
                </div>
                <div className="text-slate-100 text-sm">{h.filled_text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4">Optional: Write Custom Hooks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Concept A</label>
            <input
              value={customA}
              onChange={(e) => setCustomA(e.target.value)}
              placeholder="Max 6 words"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Concept B</label>
            <input
              value={customB}
              onChange={(e) => setCustomB(e.target.value)}
              placeholder="Max 6 words"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Concept C</label>
            <input
              value={customC}
              onChange={(e) => setCustomC(e.target.value)}
              placeholder="Max 6 words"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Tip: Keep hooks ultra-short (≤ 6 words). You can also select from the templates above.
        </p>
      </div>
    </div>
  );
}
