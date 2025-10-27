// src/components/HooksPanel.tsx
import { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../lib/config';

type HookItem = {
  id: string;
  label: string;
  text: string;
  vertical?: string;
};

const DEFAULT_HOOKS: HookItem[] = [
  { id: 'pov',            label: 'POV',             text: 'POV: You finally found the perfect {{product}}.' },
  { id: 'question',       label: 'Question',        text: 'What if {{benefit}} changed everything?' },
  { id: 'before_after',   label: 'Before/After',    text: 'Before: {{problem}} → After: {{result}}.' },
  { id: 'routine',        label: 'POV – Routine',   text: 'Your morning routine got easier with {{product}}.' },
  { id: 'stop_doing',     label: 'Stop doing',      text: 'Stop doing {{mundane_task}}. Do this instead.' },
  { id: 'did_you_know',   label: 'Did you know?',   text: 'Most people skip {{step}} and lose out on {{benefit}}.' },
  { id: 'try_this',       label: 'Try this',        text: 'This is your sign: try {{product}} that actually works.' },
  { id: 'secret',         label: 'The secret',      text: 'The secret to better {{result}} in half the time.' },
  { id: 'struggle',       label: 'If you struggle', text: 'If you struggle with {{pain_point}}: this changes everything.' },
  { id: 'obsessed',       label: 'Everyone is obsessed', text: 'Everyone is obsessed with this simple upgrade.' },
];

function normalizeHooks(payload: unknown, vertical?: string): HookItem[] {
  const raw = Array.isArray(payload)
    ? payload
    : (typeof payload === 'object' && payload && Array.isArray((payload as any).items))
      ? (payload as any).items
      : [];

  const out: HookItem[] = raw
    .map((it: any, i: number): HookItem | null => {
      const id = String(it.id ?? it.key ?? i);
      const label = String(it.label ?? it.name ?? it.tag ?? 'Hook');
      const text = String(
        it.filled_text ?? it.text ?? it.template ?? it.prompt ?? ''
      ).trim();
      if (!text) return null;
      return { id, label, text, vertical: it.vertical ?? vertical };
    })
    .filter(Boolean) as HookItem[];

  const seen = new Set<string>();
  return out.filter(h => (seen.has(h.text) ? false : (seen.add(h.text), true)));
}

export function HooksPanel({
  vertical = 'general',
  onCustomHooksChange,
}: {
  vertical?: string;
  onCustomHooksChange: (v: { A?: string; B?: string; C?: string }) => void;
}) {
  const [serverHooks, setServerHooks] = useState<HookItem[] | null>(null);
  const [useDefaults, setUseDefaults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

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

    (async () => {
      setLoading(true);
      setErrMsg(null);
      setUseDefaults(false);

      try {
        const url = `${API_URL}/api/hooks?vertical=${encodeURIComponent(vertical)}`;
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 7000);
        const res = await fetch(url, { signal: ctrl.signal, credentials: 'include' });
        clearTimeout(timer);

        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          throw new Error(`Expected JSON from /api/hooks, got ${ct || 'unknown content-type'}`);
        }

        const json = await res.json();
        const normalized = normalizeHooks(json, vertical);

        if (!cancelled) {
          if (res.ok && normalized.length) {
            setServerHooks(normalized);
          } else {
            setServerHooks(DEFAULT_HOOKS);
            setUseDefaults(true);
            setErrMsg(res.ok ? 'No hooks from API — using defaults.' : `Hooks API error ${res.status}`);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setServerHooks(DEFAULT_HOOKS);
          setUseDefaults(true);
          setErrMsg(e?.message || 'Failed to fetch hooks — using defaults.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [vertical]);

  const hooksToShow = useMemo(
    () => (serverHooks?.length ? serverHooks : DEFAULT_HOOKS),
    [serverHooks]
  );

  const takeHook = (text: string) => {
    if (!customA) setCustomA(text);
    else if (!customB) setCustomB(text);
    else setCustomC(text);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>Trending Hooks</span>
          </h3>
          {useDefaults && (
            <span className="text-xs text-yellow-300">
              Using default hooks (server connection failed)
            </span>
          )}
        </div>

        {loading && <div className="text-slate-400 text-sm mb-3">Loading hooks…</div>}
        {!!errMsg && !loading && (
          <div className="text-xs text-yellow-300 mb-3">{errMsg}</div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          {hooksToShow.map(h => (
            <button
              key={h.id}
              type="button"
              onClick={() => takeHook(h.text)}
              className="px-3 py-2 rounded-full bg-slate-800 text-slate-200 border border-slate-700 hover:border-blue-500 hover:text-white transition-colors text-sm"
              title={h.text}
            >
              {h.label}: {h.text.length > 36 ? `${h.text.slice(0, 36)}…` : h.text}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-1">Custom Hook for Concept A (optional)</label>
            <input
              value={customA}
              onChange={(e) => setCustomA(e.target.value)}
              placeholder="Write or click a pill to auto-fill"
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1">Custom Hook for Concept B (optional)</label>
            <input
              value={customB}
              onChange={(e) => setCustomB(e.target.value)}
              placeholder="Write or click a pill to auto-fill"
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1">Custom Hook for Concept C (optional)</label>
            <input
              value={customC}
              onChange={(e) => setCustomC(e.target.value)}
              placeholder="Write or click a pill to auto-fill"
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
