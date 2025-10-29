// src/lib/api.ts
import { API_URL } from './config';
import { fetchWithRetry } from './apiWithRetry';

type JSONLike = Record<string, any>;

let requestIdCounter = 0;
function generateRequestId(): string {
  return `req_${Date.now()}_${++requestIdCounter}`;
}

function base() {
  return API_URL;
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
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    console.log(`[API] POST ${path}`, {
      requestId,
      bodyKeys: Object.keys(body),
      apiUrl: base(),
      fullUrl: `${base()}${path}`
    });

    const res = await fetch(`${base()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
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
      const duration = Date.now() - startTime;
      console.error(`[API] POST ${path} failed:`, {
        requestId,
        status: res.status,
        message: detailedMsg,
        details: errorDetails,
        duration: `${duration}ms`,
        apiUrl: base()
      });

      throw new ApiError(detailedMsg, res.status, path, errorDetails);
    }

    const result = (await res.json()) as T;
    const duration = Date.now() - startTime;
    console.log(`[API] POST ${path} succeeded`, { requestId, duration: `${duration}ms` });
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error (fetch failed)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const duration = Date.now() - startTime;
      console.error(`[API] Network error on POST ${path}:`, {
        requestId,
        error: error.message,
        duration: `${duration}ms`,
        apiUrl: base()
      });
      throw new ApiError(
        'Network error. Unable to reach the server. Please check your connection.',
        0,
        path
      );
    }

    const duration = Date.now() - startTime;
    console.error(`[API] Unexpected error on POST ${path}:`, {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`
    });
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0,
      path
    );
  }
}

async function httpGet<T = JSONLike>(path: string): Promise<T> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    console.log(`[API] GET ${path}`, {
      requestId,
      apiUrl: base(),
      fullUrl: `${base()}${path}`
    });

    const res = await fetch(`${base()}${path}`, {
      headers: {
        'X-Request-ID': requestId
      }
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
      const duration = Date.now() - startTime;
      console.error(`[API] GET ${path} failed:`, {
        requestId,
        status: res.status,
        message: detailedMsg,
        details: errorDetails,
        duration: `${duration}ms`,
        apiUrl: base()
      });

      throw new ApiError(detailedMsg, res.status, path, errorDetails);
    }

    const result = (await res.json()) as T;
    const duration = Date.now() - startTime;
    console.log(`[API] GET ${path} succeeded`, { requestId, duration: `${duration}ms` });
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error (fetch failed)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const duration = Date.now() - startTime;
      console.error(`[API] Network error on GET ${path}:`, {
        requestId,
        error: error.message,
        duration: `${duration}ms`,
        apiUrl: base()
      });
      throw new ApiError(
        'Network error. Unable to reach the server. Please check your connection.',
        0,
        path
      );
    }

    const duration = Date.now() - startTime;
    console.error(`[API] Unexpected error on GET ${path}:`, {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`
    });
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0,
      path
    );
  }
}

/** POST /api/ingest/url { url, userId } -> { projectId, productData, ... } */
export async function ingest(payload: { url: string; userId: string }) {
  return fetchWithRetry(
    () => httpPost('/api/ingest/url', payload),
    'Ingest URL',
    { maxRetries: 2 }
  );
}

/** POST /api/plan { projectId, ... } -> { variants, projectId, ... } */
export async function plan(body: JSONLike) {
  return fetchWithRetry(
    () => httpPost('/api/plan', body),
    'Generate Plan',
    { maxRetries: 2 }
  );
}

/** POST /api/render/previews { projectId, userId } -> { runs: [...] } */
export async function renderPreviews(payload: { projectId: string; userId: string }) {
  return fetchWithRetry(
    () => httpPost('/api/render/previews', payload),
    'Render Previews',
    { maxRetries: 2 }
  );
}

/** (optional) POST /api/render/finals { projectId, userId } */
export async function renderFinals(payload: { projectId: string; userId: string }) {
  return fetchWithRetry(
    () => httpPost('/api/render/finals', payload),
    'Render Finals',
    { maxRetries: 2 }
  );
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
