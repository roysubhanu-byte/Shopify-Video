import { API_URL } from './config';

function assertJSON(res: Response) {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json');
}

export async function ingest(url: string) {
  const res = await fetch(`${API_URL}/api/ingest/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!assertJSON(res)) {
    const text = await res.text();
    throw new Error(`Ingest returned non-JSON (${res.status}): ${text.slice(0, 160)}`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Ingest failed (${res.status})`);
  return data; // expected to include { projectId, ... }
}

export async function plan(projectId: string, payload: any) {
  const res = await fetch(`${API_URL}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, ...payload }),
  });
  if (!assertJSON(res)) throw new Error(`Plan returned non-JSON (${res.status})`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Plan failed (${res.status})`);
  return data;
}

export async function renderPreviews(payload: {
  projectId: string;
  variantIds: string[];
  mode: 'preview' | 'final';
}) {
  const res = await fetch(`${API_URL}/api/render/previews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!assertJSON(res)) throw new Error(`Render returned non-JSON (${res.status})`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Render failed (${res.status})`);
  return data as { runId: string };
}

export async function getJobStatus(runId: string) {
  const res = await fetch(`${API_URL}/api/render/status?runId=${encodeURIComponent(runId)}`);
  if (!assertJSON(res)) throw new Error(`Status returned non-JSON (${res.status})`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Status failed (${res.status})`);
  return data as {
    status: 'queued' | 'running' | 'succeeded' | 'failed';
    variants: Array<{ variantId: string; status: string; videoUrl?: string }>;
  };
}
