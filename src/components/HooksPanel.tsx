import { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../lib/config';
import { Sparkles } from 'lucide-react';

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

  // simple local selections for A/B/C (optional UI; keep whatever you had)
  const [selA, setSelA] = useState<string | undefined>();
  const [selB, setSelB] = useState<string | undefined>();
  const [selC, setSelC] = useState<string | undefined>();

  const fallbackHooks: HookTemplate[] = useMemo(
    () => [
      { id: 'fallback-1', label: 'POV',           filled_text: 'POV: You finally found the perfect {{product}}' },
      { id: 'fallback-2', label: 'Question',      filled_text: 'Question: What if {{benefit}} changed everything?' },
      { id: 'fallback-3', label: 'Before/After',  filled_text: 'Before: {{problem}} → After: {{result}}' },
      { id: 'fallback-4', label: 'Stop doing',    filled_text: 'Stop doing {{mundane_task}}. Do this instead.' },
      { id: 'fallback-5', label: 'Did you know?', filled_text: 'Did you know most people skip {{secret_step}}?' },
      { id: 'fallback-6', label: 'This is your sign', filled_text: 'This is your sign: try {{product}} now' },
      { id: 'fallback-7', label: 'The secret to', filled_text: 'The secret to better {{result}} in half the time' },
      { id: 'fallback-8', label: 'If you struggle', filled_text: 'If you struggle with {{pain_point}}: this changes everything' },
    ],
    []
  );

  useEffect(() => {
    let aborted = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_URL}/api/hooks?vertical=${encodeURIComponent(vertical)}`;
        const res = await fetch(url, { credentials: 'include' });

        const ct = res.headers.get('content-type') || '';
        // helpful diagnostics if this ever fails again
        if (!res.ok || !ct.includes('application/json')) {
          const preview = await res.text().catch(() => '');
          console.warn('[hooks] Bad response', {
            requestUrl: url,
            status: res.status,
            contentType: ct,
            preview: preview.slice(0, 200),
          });
          throw new Error(
            res.ok
              ? `Hooks endpoint did not return JSON (got: ${ct || 'unknown'})`
              : `Failed to fetch hooks (${res.status})`
          );
        }

        const data = await res.json();
        const items: HookTemplate[] = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];

        if (!aborted) setHooks(items.length ? items : fallbackHooks);
      } catch (e) {
        if (!aborted) {
          console.warn('Failed to fetch hooks, using defaults:', e);
          setError(
            e instanceof Error ? e.message : 'Failed to load hooks'
          );
          setHooks(fallbackHooks);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [API_URL, vertical, fallbackHooks]);

  // bubble A/B/C selections upward (keep your existing custom input UI if you had it)
  useEffect(() => {
    onCustomHooksChange({ A: selA, B: selB, C: selC });
  }, [selA, selB, selC, onCustomHooksChange]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <h3 className="text-white font-semibold">Trending Hooks</h3>
        {error && (
          <span className="text-amber-400 text-xs ml-2">
            Using default hooks (server connection failed)
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-slate-400">Loading hooks…</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {hooks.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                // quick sample behavior — pick in order A, then B, then C
                if (!selA) setSelA(h.filled_text);
                else if (!selB) setSelB(h.filled_text);
                else setSelC(h.filled_text);
              }}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500 text-slate-200"
              title={h.filled_text}
            >
              {h.label}: {h.filled_text.length > 36 ? h.filled_text.slice(0, 33) + '…' : h.filled_text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
