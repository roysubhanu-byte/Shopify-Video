import type {
  IngestResponse,
  PlanResponse,
  RenderRequest,
  RenderResponse,
  JobStatusResponse,
} from '../types/api';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === '1';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
  };
}

const mockVideoUrls = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockJobs = new Map<string, JobStatusResponse>();

export async function ingest(url: string): Promise<IngestResponse> {
  if (USE_MOCK) {
    await sleep(1000);
    return {
      projectId: `proj_${Date.now()}`,
      productData: {
        title: 'Premium Wireless Headphones',
        price: '$149.99',
        bullets: [
          'Active Noise Cancellation',
          '30-hour battery life',
          'Premium sound quality',
          'Comfortable over-ear design',
        ],
        images: [
          'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg',
        ],
        reviews: ['Amazing sound quality!', 'Best headphones I ever owned'],
        colors: ['Black', 'Silver', 'Blue'],
      },
    };
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/ingest`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('Failed to ingest product URL');
  }

  return response.json();
}

export async function plan(
  projectId: string,
  options?: {
    A?: string;
    B?: string;
    C?: string;
    brandTonePrompt?: string;
    targetMarket?: string;
    creationMode?: 'automated' | 'manual';
    manualPrompt?: string;
    framework?: string;
  }
): Promise<PlanResponse> {
  if (USE_MOCK) {
    await sleep(1500);
    return {
      projectId,
      variants: [
        {
          id: `var_a_${Date.now()}`,
          label: 'A',
          hook: options?.A || "POV: You finally found headphones that don't hurt after 2 hours",
          conceptType: 'POV',
          seed: 12345,
          beats: [
            { duration: 3, prompt: 'Close-up of frustrated person', voiceOver: 'Tired of uncomfortable headphones?' },
            { duration: 4, prompt: 'Product showcase with comfort features', voiceOver: 'Meet the most comfortable headphones' },
            { duration: 3, prompt: 'Happy user wearing headphones', voiceOver: 'All-day comfort guaranteed' },
            { duration: 2, prompt: 'Product with CTA', voiceOver: 'Try them risk-free today' },
          ],
        },
        {
          id: `var_b_${Date.now()}`,
          label: 'B',
          hook: options?.B || 'What if headphones could actually last all day?',
          conceptType: 'Question',
          seed: 67890,
          beats: [
            { duration: 3, prompt: 'Dead battery icon', voiceOver: 'Battery always dying?' },
            { duration: 4, prompt: 'Headphones with battery indicator', voiceOver: '30 hours of playtime' },
            { duration: 3, prompt: 'Person using throughout day', voiceOver: 'From morning to night' },
            { duration: 2, prompt: 'Product shot with price', voiceOver: 'Get yours now' },
          ],
        },
        {
          id: `var_c_${Date.now()}`,
          label: 'C',
          hook: options?.C || 'Before: Noise everywhere. After: Pure focus.',
          conceptType: 'Before-After',
          seed: 11111,
          beats: [
            { duration: 3, prompt: 'Chaotic noisy environment', voiceOver: 'Distractions everywhere?' },
            { duration: 4, prompt: 'Person puts on headphones', voiceOver: 'Active noise cancellation' },
            { duration: 3, prompt: 'Peaceful focused state', voiceOver: 'Complete silence' },
            { duration: 2, prompt: 'Product with guarantee badge', voiceOver: 'Experience it yourself' },
          ],
        },
      ],
    };
  }

  const headers = await getAuthHeaders();
  const { data: { user } } = await supabase.auth.getUser();

  const body: any = { projectId, userId: user?.id };

  if (options?.A) body.overrideHookA = options.A;
  if (options?.B) body.overrideHookB = options.B;
  if (options?.C) body.overrideHookC = options.C;
  if (options?.brandTonePrompt) body.brandTonePrompt = options.brandTonePrompt;
  if (options?.targetMarket) body.targetMarket = options.targetMarket;
  if (options?.creationMode) body.creationMode = options.creationMode;
  if (options?.manualPrompt) body.manualPrompt = options.manualPrompt;
  if (options?.framework) body.framework = options.framework;

  const response = await fetch(`${API_URL}/api/plan`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Failed to generate plan');
  }

  return response.json();
}

export async function renderPreviews(request: RenderRequest): Promise<RenderResponse> {
  if (USE_MOCK) {
    await sleep(500);
    const runId = `run_${Date.now()}`;

    const mockResponse: JobStatusResponse = {
      runId,
      status: 'queued',
      variants: request.variantIds.map((variantId) => ({
        variantId,
        status: 'queued',
      })),
    };

    mockJobs.set(runId, mockResponse);

    setTimeout(() => {
      const job = mockJobs.get(runId);
      if (job) {
        job.status = 'running';
        job.variants = job.variants.map(v => ({ ...v, status: 'running' }));
        mockJobs.set(runId, job);
      }
    }, 2000);

    setTimeout(() => {
      const job = mockJobs.get(runId);
      if (job) {
        job.status = 'succeeded';
        job.variants = job.variants.map((v, idx) => ({
          ...v,
          status: 'succeeded',
          videoUrl: mockVideoUrls[idx % mockVideoUrls.length],
          thumbnailUrl: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg',
        }));
        mockJobs.set(runId, job);
      }
    }, 5000);

    return {
      runId,
      status: 'queued',
      variants: mockResponse.variants,
    };
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/render/previews`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to start preview render');
  }

  return response.json();
}

export async function renderFinals(request: RenderRequest): Promise<RenderResponse> {
  if (USE_MOCK) {
    await sleep(500);
    const runId = `run_final_${Date.now()}`;

    const mockResponse: JobStatusResponse = {
      runId,
      status: 'queued',
      variants: request.variantIds.map(variantId => ({
        variantId,
        status: 'queued',
      })),
    };

    mockJobs.set(runId, mockResponse);

    return {
      runId,
      status: 'queued',
      variants: mockResponse.variants,
    };
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/render/finals`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to start final render');
  }

  return response.json();
}

export async function getJobStatus(runId: string): Promise<JobStatusResponse> {
  if (USE_MOCK) {
    await sleep(300);
    const job = mockJobs.get(runId);
    if (!job) {
      throw new Error('Job not found');
    }
    return job;
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/jobs/${runId}`, { headers });

  if (!response.ok) {
    throw new Error('Failed to get job status');
  }

  return response.json();
}

export async function promptPlan(request: import('../types/api').PromptPlanRequest): Promise<import('../types/api').PromptPlanResponse> {
  if (USE_MOCK) {
    await sleep(1000);
    return {
      promptId: `prompt_${Date.now()}`,
      hook: 'Transform your content creation workflow',
      scriptBeats: [
        { text: 'Show the current struggle with content creation', duration: 4 },
        { text: 'Introduce the solution', duration: 3 },
        { text: 'Demonstrate key benefits', duration: 4 },
        { text: 'Call to action', duration: 3 },
      ],
      overlays: [
        { text: 'Save Time', timestamp: 5 },
        { text: 'Create Better', timestamp: 9 },
      ],
      voiceId: 'default',
      estimatedDuration: 14,
    };
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/prompt/plan`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to generate prompt plan');
  }

  return response.json();
}

export async function promptRenderPreview(request: import('../types/api').PromptRenderRequest): Promise<import('../types/api').PromptRenderResponse> {
  if (USE_MOCK) {
    await sleep(500);
    return {
      runId: `run_prompt_${Date.now()}`,
      status: 'queued',
    };
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/prompt/render/preview`, {
    method: 'POST',
    headers: {
      ...headers,
      'Idempotency-Key': request.idempotencyKey,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to render preview' }));
    throw new Error(error.message || 'Failed to render preview');
  }

  return response.json();
}

export async function promptRenderFinal(request: import('../types/api').PromptRenderRequest): Promise<import('../types/api').PromptRenderResponse> {
  if (USE_MOCK) {
    await sleep(500);
    return {
      runId: `run_prompt_final_${Date.now()}`,
      status: 'queued',
    };
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/prompt/render/final`, {
    method: 'POST',
    headers: {
      ...headers,
      'Idempotency-Key': request.idempotencyKey,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to render final' }));
    throw new Error(error.message || 'Failed to render final');
  }

  return response.json();
}

export async function getPromptJobStatus(runId: string): Promise<import('../types/api').PromptJobStatusResponse> {
  if (USE_MOCK) {
    await sleep(300);
    return {
      runId,
      status: 'succeeded',
      videoUrl: mockVideoUrls[0],
      thumbnailUrl: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg',
    };
  }

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/prompt/jobs/${runId}`, { headers });

  if (!response.ok) {
    throw new Error('Failed to get prompt job status');
  }

  return response.json();
}

export async function uploadReferenceImage(
  variantId: string,
  beatNumber: number,
  imageFile: File
): Promise<{
  success: boolean;
  override: {
    id: string;
    beatNumber: number;
    publicUrl: string;
    thumbnailUrl: string;
    width?: number;
    height?: number;
  };
}> {
  const { data: { session } } = await supabase.auth.getSession();
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(
    `${API_URL}/api/beats/${variantId}/${beatNumber}/upload-reference`,
    {
      method: 'POST',
      headers: {
        ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to upload reference image' }));
    throw new Error(error.error || 'Failed to upload reference image');
  }

  return response.json();
}

export async function getReferenceImages(variantId: string): Promise<{
  variantId: string;
  referenceImages: Array<{
    id: string;
    beat_number: number;
    public_url: string;
    thumbnail_url: string;
    original_filename: string;
    width?: number;
    height?: number;
  }>;
}> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/variants/${variantId}/reference-images`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch reference images');
  }

  return response.json();
}

export async function deleteReferenceImage(
  variantId: string,
  beatNumber: number
): Promise<{ success: boolean; message: string }> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_URL}/api/beats/${variantId}/${beatNumber}/reference-image`,
    {
      method: 'DELETE',
      headers,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete reference image');
  }

  return response.json();
}

export async function reshootBeat(
  beatGenerationId: string,
  options: {
    reason: string;
    reasonCategory?: 'quality_issue' | 'wrong_product' | 'bad_composition' | 'text_issue' | 'creative_direction' | 'other';
    promptModifications?: string;
    newReferenceImageUrl?: string;
    newSeed?: number;
  }
): Promise<{
  success: boolean;
  reshootId: string;
  newBeatGenerationId: string;
  creditsCharged: number;
  creditsRemaining: number;
  message: string;
}> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/beats/${beatGenerationId}/reshoot`, {
    method: 'POST',
    headers,
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to reshoot beat' }));
    throw new Error(error.error || 'Failed to reshoot beat');
  }

  return response.json();
}

export async function getBeatQuality(beatGenerationId: string): Promise<{
  beatGenerationId: string;
  validations: Array<{
    id: string;
    validation_type: string;
    passed: boolean;
    score: number;
    issues_found: string[];
    suggestions: string[];
    created_at: string;
  }>;
}> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/beats/${beatGenerationId}/quality`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch beat quality');
  }

  return response.json();
}
