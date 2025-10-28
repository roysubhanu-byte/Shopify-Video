// src/lib/api.ts
type Json = Record<string, any>;

const API_URL =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') ||
  (window as any).__API_URL__?.replace(/\/$/, '') ||
  '';

function apiBase() {
  // If VITE_API_URL is set, use it. Otherwise fall back to same-origin.
  return API_URL || window.location.origin;
}

async function post<T = Json>(path: string, body: Json): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

async function get<T = Json>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

/**
 * Ingest a product/page URL and create a project.
 * Backend route: POST /api/ingest/url
 * Body: { url, userId }
 * Returns: { projectId, productData, ... }
 */
export async function ingest(payload: { url: string; userId: string }) {
  return post('/api/ingest/url', payload);
}

/**
 * Generate a plan for a project.
 * Backend route: POST /api/plan
 * Body: { projectId, hooks?, brandTonePrompt?, targetMarket?, creationMode? ... }
 * Returns: { variants, projectId, ... }
 */
export async function plan(body: Json) {
  return post('/api/plan', body);
}

/**
 * Queue preview renders for a project’s variants.
 * Backend route: POST /api/render/previews
 * Body: { projectId, userId }
 * Returns: { runs: [...], success: true }
 */
export async function renderPreviews(payload: { projectId: string; userId: string }) {
  return post('/api/render/previews', payload);
}

/**
 * Queue final renders for a project’s variants.
 * Backend route: POST /api/render/finals
 * Body: { projectId, userId }
 */
export async function renderFinals(payload: { projectId: string; userId: string }) {
  return post('/api/render/finals', payload);
}

/**
 * Get status for a particular render run.
 * Backend route: GET /api/render/:runId/status
 * Returns: { id, variantId, engine, state, videoUrl?, error? }
 */
export async function getJobStatus(runId: string) {
  return get(`/api/render/${encodeURIComponent(runId)}/status`);
}

/**
 * Optional: hooks list for UI
 * Backend route: GET /api/hooks?vertical=general
 */
export async function fetchHooks(vertical = 'general') {
  return get(`/api/hooks?vertical=${encodeURIComponent(vertical)}`);
}
