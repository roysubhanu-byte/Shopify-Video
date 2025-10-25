import type {
  IngestResponse,
  PlanResponse,
  RenderRequest,
  RenderResponse,
  JobStatusResponse,
} from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === '1';

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

  const response = await fetch(`${API_URL}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('Failed to ingest product URL');
  }

  return response.json();
}

export async function plan(projectId: string): Promise<PlanResponse> {
  if (USE_MOCK) {
    await sleep(1500);
    return {
      projectId,
      variants: [
        {
          id: `var_a_${Date.now()}`,
          label: 'A',
          hook: "POV: You finally found headphones that don't hurt after 2 hours",
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
          hook: 'What if headphones could actually last all day?',
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
          hook: 'Before: Noise everywhere. After: Pure focus.',
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

  const response = await fetch(`${API_URL}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
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

  const response = await fetch(`${API_URL}/api/render/previews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

  const response = await fetch(`${API_URL}/api/render/finals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

  const response = await fetch(`${API_URL}/api/jobs/${runId}`);

  if (!response.ok) {
    throw new Error('Failed to get job status');
  }

  return response.json();
}
