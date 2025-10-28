// src/lib/api.ts
type JSON = Record<string, any>;

const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL ||
  (window as any).__API_URL__ ||
  window.location.origin;

async function http<T = JSON>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    const msg = data?.error || res.statusText || 'Request failed';
    throw new Error(msg);
  }
  return data as T;
}

/* Canonical (new) names */
export function plan(payload: {
  freeText: string;
  aspect: '9:16' | '1:1' | '16:9';
  duration: number;
  tone: string;
}) {
  return http('/api/plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function renderPreviews(payload: {
  promptId: string;
  mode: 'preview';
  idempotencyKey?: string;
}) {
  return http('/api/render/previews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function renderFinals(payload: {
  promptId: string;
  mode: 'final';
  idempotencyKey?: string;
}) {
  return http('/api/render/finals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getJobStatus(runId: string) {
  return http(`/api/render/${encodeURIComponent(runId)}/status`);
}

/* Compatibility exports (old names) — keep both so either import style works */
export const promptPlan = plan;
export const promptRenderPreview = renderPreviews;
export const promptRenderFinal = renderFinals;
export const getPromptJobStatus = getJobStatus;
