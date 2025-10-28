// src/lib/api.ts
type JSONLike = Record<string, any>;

const API_URL =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') ||
  (window as any).__API_URL__?.replace(/\/$/, '') ||
  '';

function base() {
  return API_URL || window.location.origin;
}

async function httpPost<T = JSONLike>(path: string, body: JSONLike): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

async function httpGet<T = JSONLike>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

/** POST /api/ingest/url { url, userId } -> { projectId, productData, ... } */
export async function ingest(payload: { url: string; userId: string }) {
  return httpPost('/api/ingest/url', payload);
}

/** POST /api/plan { projectId, ... } -> { variants, projectId, ... } */
export async function plan(body: JSONLike) {
  return httpPost('/api/plan', body);
}

/** POST /api/render/previews { projectId, userId } -> { runs: [...] } */
export async function renderPreviews(payload: { projectId: string; userId: string }) {
  return httpPost('/api/render/previews', payload);
}

/** (optional) POST /api/render/finals { projectId, userId } */
export async function renderFinals(payload: { projectId: string; userId: string }) {
  return httpPost('/api/render/finals', payload);
}

/** GET /api/render/:runId/status -> { id, state, videoUrl?, error? } */
export async function getJobStatus(runId: string) {
  return httpGet(`/api/render/${encodeURIComponent(runId)}/status`);
}

/** (optional) GET /api/hooks?vertical=general */
export async function fetchHooks(vertical = 'general') {
  return httpGet(`/api/hooks?vertical=${encodeURIComponent(vertical)}`);
}
