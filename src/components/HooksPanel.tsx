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
  const [custom, setCustom] = useState<{ A?: string; B?: string; C?: string }>({});

  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_URL}/api/hooks?vertical=${encodeURIComponent(vertical)}`;
        const res = await fetch(url, { credentials: 'include' });

        if (!res.ok) {
          let msg = `Failed to fetch hooks (${res.status})`;
          try {
            const j = await res.json();
            msg = j?.error || msg;
          } catch {
            /* ignore */
          }
          throw new Error(msg);
        }

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
          setHooks([
            { id: 'fallback-1', label: 'POV', filled_text: 'POV: {{pain_point}} ends today' },
            { id: 'fallback-2', label: 'Question', filled_text: 'What if {{benefit}} took 10s?' },
            { id: 'fallback-3', label: 'Before/After', filled_text: 'Before: {{problem}} → After: {{result}}' },
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

  useEffect(() => {
    onCustomHooksChange(custom);
  }, [custom, onCustomHooksChange]);

  return (
    <div className="space-y-6">
      {loading && <div className="text-slate-400">Loading hooks…</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hooks.map((h, idx) => (
          <div key={h.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-xs uppercase text-slate-400 mb-1">{h.label}</div>
            <div className="text-white mb-3">{h.filled_text}</div>
            <input
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500"
              placeholder={`Custom hook for ${h.label} (optional)`}
              value={(custom as any)[['A', 'B', 'C'][idx]] || ''}
              onChange={(e) => {
                const key = (['A', 'B', 'C'][idx] ?? 'A') as 'A' | 'B' | 'C';
                setCustom((prev) => ({ ...prev, [key]: e.target.value }));
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
