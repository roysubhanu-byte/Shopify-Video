// src/components/HooksPanel.tsx
import { useEffect, useState } from 'react';
import { API_URL } from '../lib/config';

type HookRecord =
  | { id?: string; label?: string; filled_text?: string } // legacy client shape
  | { template?: string; example?: string; vertical?: string }; // current server shape

type UnifiedHook = {
  id: string;
  label: string;       // short name (e.g., "Did you know?")
  text: string;        // full snippet to use (e.g., example)
};

export function HooksPanel({
  vertical = 'general',
  onCustomHooksChange,
}: {
  vertical?: string;
  onCustomHooksChange: (v: { A?: string; B?: string; C?: string }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [unified, setUnified] = useState<UnifiedHook[]>([]);
  const [A, setA] = useState('');
  const [B, setB] = useState('');
  const [C, setC] = useState('');

  // Count words in a string
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const getWordCountColor = (count: number) => {
    if (count === 0) return 'text-slate-500';
    if (count > 15) return 'text-red-400';
    if (count > 12) return 'text-yellow-400';
    return 'text-green-400';
  };

  // lift to parent whenever values change
  useEffect(() => {
    onCustomHooksChange({ A: A || undefined, B: B || undefined, C: C || undefined });
  }, [A, B, C, onCustomHooksChange]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setServerError(null);
      try {
        const url = `${API_URL}/api/hooks?vertical=${encodeURIComponent(vertical)}`;
        const res = await fetch(url, { credentials: 'include' });

        if (!res.ok) {
          let msg = `Failed to fetch hooks (${res.status})`;
          try {
            const j = await res.json();
            if (j?.error) msg = j.error;
          } catch {}
          throw new Error(msg);
        }

        const data = await res.json();

        // Accept both shapes:
        //   { items: [{ id, label, filled_text }] }
        //   { hooks: [{ template, example, vertical }] }
        const items: HookRecord[] = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.hooks)
          ? data.hooks
          : [];

        const mapped: UnifiedHook[] = items.map((h: HookRecord, i: number) => {
          // prefer new server shape when present
          const label = (h as any).template ?? (h as any).label ?? `Hook ${i + 1}`;
          const text =
            (h as any).example ??
            (h as any).filled_text ??
            (h as any).template ??
            `Hook ${i + 1}`;
          return {
            id: (h as any).id ?? `${i}`,
            label: String(label),
            text: String(text),
          };
        });

        if (!cancelled) setUnified(mapped);
      } catch (e: any) {
        if (!cancelled) {
          setServerError(e?.message || 'Failed to load hooks');
          setUnified([]); // will show "Using defaults" banner if you add one later
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [vertical]);

  const hasHooks = unified.length > 0;

  // click a pill → fill A then B then C cyclically
  const handlePick = (text: string) => {
    if (!A) setA(text);
    else if (!B) setB(text);
    else if (!C) setC(text);
    else {
      // rotate: A<-B, B<-C, C<-text
      setA(B);
      setB(C);
      setC(text);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-white">Trending Hooks</div>
        {!hasHooks && (
          <div className="text-xs text-yellow-300">
            Using default hooks (server connection failed or returned no items)
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Pills */}
        <div className="flex flex-wrap gap-2">
          {loading && (
            <div className="text-slate-400 text-sm">Loading hooks…</div>
          )}
          {serverError && (
            <div className="text-red-300 text-sm">{serverError}</div>
          )}
          {hasHooks &&
            unified.map((h) => (
              <button
                key={h.id}
                onClick={() => handlePick(h.text)}
                className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 hover:border-blue-500 hover:text-white transition"
                title={h.text}
              >
                {h.label.length > 38 ? `${h.label.slice(0, 38)}…` : h.label}
              </button>
            ))}
        </div>

        {/* Custom A */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-300">Custom Hook for Concept A (optional)</span>
            <span className={`text-xs ${getWordCountColor(countWords(A))}`}>
              {countWords(A)}/15 words {countWords(A) > 15 && '⚠️'}
            </span>
          </div>
          <input
            value={A}
            onChange={(e) => setA(e.target.value)}
            placeholder="Type or click a pill above to fill…"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Custom B */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-300">Custom Hook for Concept B (optional)</span>
            <span className={`text-xs ${getWordCountColor(countWords(B))}`}>
              {countWords(B)}/15 words {countWords(B) > 15 && '⚠️'}
            </span>
          </div>
          <input
            value={B}
            onChange={(e) => setB(e.target.value)}
            placeholder="Type or click a pill above to fill…"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Custom C */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-300">Custom Hook for Concept C (optional)</span>
            <span className={`text-xs ${getWordCountColor(countWords(C))}`}>
              {countWords(C)}/15 words {countWords(C) > 15 && '⚠️'}
            </span>
          </div>
          <input
            value={C}
            onChange={(e) => setC(e.target.value)}
            placeholder="Type or click a pill above to fill…"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
