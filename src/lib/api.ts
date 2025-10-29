// src/lib/api.ts
type JSONLike = Record<string, any>;

const API_URL =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') ||
  (window as any).__API_URL__?.replace(/\/$/, '') ||
  '';

function base() {
  return API_URL || window.location.origin;
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getDetailedErrorMessage(status: number, defaultMsg: string, endpoint: string): string {
  // Network/Connection errors
  if (status === 0) {
    return 'Unable to connect to server. Please check your internet connection.';
  }

  // Client errors
  if (status === 400) {
    return defaultMsg || 'Invalid request. Please check your input and try again.';
  }
  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (status === 403) {
    if (defaultMsg.toLowerCase().includes('cors')) {
      return 'Connection blocked by security policy. Please contact support.';
    }
    return 'Access denied. You may not have permission for this action.';
  }
  if (status === 404) {
    return 'Requested resource not found. It may have been deleted.';
  }
  if (status === 408) {
    return 'Request timed out. The server took too long to respond.';
  }
  if (status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Server errors
  if (status === 500) {
    return defaultMsg || 'Server error. Our team has been notified.';
  }
  if (status === 502) {
    return 'Server temporarily unavailable. Please try again in a moment.';
  }
  if (status === 503) {
    return 'Service temporarily unavailable. Please try again shortly.';
  }
  if (status === 504) {
    return 'Server timeout. The request took too long to process.';
  }

  return defaultMsg || `Request failed with status ${status}`;
}

async function httpPost<T = JSONLike>(path: string, body: JSONLike): Promise<T> {
  try {
    console.log(`[API] POST ${path}`, { bodyKeys: Object.keys(body) });

    const res = await fetch(`${base()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}`;
      let errorDetails = null;

      try {
        const errorData = await res.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
        errorDetails = errorData.details || errorData;
      } catch {
        // Failed to parse error response
      }

      const detailedMsg = getDetailedErrorMessage(res.status, errorMsg, path);
      console.error(`[API] POST ${path} failed:`, {
        status: res.status,
        message: detailedMsg,
        details: errorDetails,
      });

      throw new ApiError(detailedMsg, res.status, path, errorDetails);
    }

    const result = (await res.json()) as T;
    console.log(`[API] POST ${path} succeeded`);
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error (fetch failed)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`[API] Network error on POST ${path}:`, error);
      throw new ApiError(
        'Network error. Unable to reach the server. Please check your connection.',
        0,
        path
      );
    }

    console.error(`[API] Unexpected error on POST ${path}:`, error);
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0,
      path
    );
  }
}

async function httpGet<T = JSONLike>(path: string): Promise<T> {
  try {
    console.log(`[API] GET ${path}`);

    const res = await fetch(`${base()}${path}`);

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}`;
      let errorDetails = null;

      try {
        const errorData = await res.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
        errorDetails = errorData.details || errorData;
      } catch {
        // Failed to parse error response
      }

      const detailedMsg = getDetailedErrorMessage(res.status, errorMsg, path);
      console.error(`[API] GET ${path} failed:`, {
        status: res.status,
        message: detailedMsg,
        details: errorDetails,
      });

      throw new ApiError(detailedMsg, res.status, path, errorDetails);
    }

    const result = (await res.json()) as T;
    console.log(`[API] GET ${path} succeeded`);
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error (fetch failed)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`[API] Network error on GET ${path}:`, error);
      throw new ApiError(
        'Network error. Unable to reach the server. Please check your connection.',
        0,
        path
      );
    }

    console.error(`[API] Unexpected error on GET ${path}:`, error);
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0,
      path
    );
  }
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

/** GET /api/render/status/:runId -> { id, state, videoUrl?, error? } */
export async function getJobStatus(runId: string) {
  return httpGet(`/api/render/status/${encodeURIComponent(runId)}`);
}

/** (optional) GET /api/hooks?vertical=general */
export async function fetchHooks(vertical = 'general') {
  return httpGet(`/api/hooks?vertical=${encodeURIComponent(vertical)}`);
}

/** POST /api/reference-images/upload */
export async function uploadReferenceImage(variantId: string, beatNumber: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('variantId', variantId);
  formData.append('beatNumber', beatNumber.toString());

  const res = await fetch(`${base()}/api/reference-images/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return await res.json();
}

/** DELETE /api/reference-images/:variantId/:beatNumber */
export async function deleteReferenceImage(variantId: string, beatNumber: number) {
  const res = await fetch(`${base()}/api/reference-images/${variantId}/${beatNumber}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return await res.json();
}

/** POST /api/reshoot */
export async function reshootBeat(payload: { variantId: string; beatNumber: number; userId: string }) {
  return httpPost('/api/reshoot', payload);
}
