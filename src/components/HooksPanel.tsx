import { useEffect, useState } from 'react';
import { API_URL } from '../lib/config';

const DEFAULT_HOOKS = [
  { id: 'pov',    label: 'POV',            filled_text: 'POV: You finally found the perfect {{product}}' },
  { id: 'q',      label: 'Question',       filled_text: 'Question: What if {{benefit}} changed everything?' },
  { id: 'ba',     label: 'Before/After',   filled_text: 'Before: {{problem}} → After: {{result}}' },
  { id: 'stop',   label: 'Stop doing',     filled_text: 'Stop doing {{mundane_task}}. Do this instead.' },
  { id: 'dyk',    label: 'Did you know',   filled_text: 'Did you know most people skip {{step}} and lose out on {{benefit}}?' },
  { id: 'sign',   label: 'This is your sign', filled_text: 'This is your sign: try {{product}} today' },
  { id: 'secret', label: 'The secret',     filled_text: 'The secret to better {{result}} in half the time' },
  { id: 'if',     label: 'If you struggle', filled_text: 'If you struggle with {{pain_point}}, this changes everything' },
];

type HookTemplate = { id: string; label?: string; filled_text: string; vertical?: string; };

export function HooksPanel({
  vertical = 'general',
  onCustomHooksChange,
}: {
  vertical?: string;
  onCustomHooksChange: (v: { A?: string; B?: string; C?: string }) => void;
}) {
  const [hooks, setHooks] = useState<HookTemplate[]>(DEFAULT_HOOKS);
  const [msg, setMsg] = useState<string | null>(null);
  const [custom, setCustom] = useState<{A?: string; B?: string; C?: string}>({});

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const url = `${API_URL}/api/hooks?vertical=${encodeURIComponent(vertical)}`;
        const res = await fetch(url, { credentials: 'include' });

        const ct = res.headers.get('content-type') || '';
        if (!res.ok || !ct.includes('application/json')) {
          setMsg('Using default hooks (server connection failed)');
          return; // keep defaults
        }

        const data = await res.json();
        if (Array.isArray(data?.items) && data.items.length) {
          if (!aborted) setHooks(data.items);
        } else {
          setMsg('Using default hooks (none from API)');
        }
      } catch {
        setMsg('Using default hooks (server connection failed)');
      }
    })();
    return () => { aborted = true; };
  }, [vertical]);

  useEffect(() => { onCustomHooksChange(custom); }, [custom, onCustomHooksChange]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Trending Hooks</h3>
        {msg && <div className="text-amber-400 text-xs">{msg}</div>}
      </div>

      {/* Always render chips, even if we’re using defaults */}
      <div className="flex flex-wrap gap-2 mb-6">
        {hooks.map(h => (
          <button
            key={h.id}
            type="button"
            onClick={() => setCustom((prev) => ({ ...prev, A: h.filled_text }))}
            className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-200 text-sm hover:bg-slate-700"
            title={h.filled_text}
          >
            {h.label || (h.filled_text.length > 40 ? h.filled_text.slice(0, 40) + '…' : h.filled_text)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-slate-400 text-sm">Custom Hook for Concept A (optional)</label>
          <input
            className="w-full mt-1 bg-slate-800 text-white rounded-lg px-3 py-2 border border-slate-700"
            value={custom.A || ''}
            onChange={(e) => setCustom({ ...custom, A: e.target.value })}
            placeholder="Try something that actually works"
          />
        </div>
        <div>
          <label className="text-slate-400 text-sm">Custom Hook for Concept B (optional)</label>
          <input
            className="w-full mt-1 bg-slate-800 text-white rounded-lg px-3 py-2 border border-slate-700"
            value={custom.B || ''}
            onChange={(e) => setCustom({ ...custom, B: e.target.value })}
            placeholder="Better results in half the time"
          />
        </div>
        <div>
          <label className="text-slate-400 text-sm">Custom Hook for Concept C (optional)</label>
          <input
            className="w-full mt-1 bg-slate-800 text-white rounded-lg px-3 py-2 border border-slate-700"
            value={custom.C || ''}
            onChange={(e) => setCustom({ ...custom, C: e.target.value })}
            placeholder="Stop wasting money on this"
          />
        </div>
      </div>
    </div>
  );
}
