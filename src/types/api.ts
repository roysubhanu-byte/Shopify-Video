export interface IngestResponse {
  projectId: string;
  productData: {
    title: string;
    price: string;
    bullets: string[];
    images: string[];
    reviews?: string[];
    colors?: string[];
  };
}

export interface PlanResponse {
  projectId: string;
  variants: VariantPlan[];
}

export interface VariantPlan {
  id: string;
  label: 'A' | 'B' | 'C';
  hook: string;
  conceptType: 'POV' | 'Question' | 'Before-After';
  seed: number;
  beats: Beat[];
}

export interface Beat {
  duration: number;
  prompt: string;
  voiceOver: string;
}

export interface RenderRequest {
  projectId: string;
  variantIds: string[];
  mode: 'preview' | 'final';
}

export interface RenderResponse {
  runId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  variants: VariantRender[];
}

export interface VariantRender {
  variantId: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  srtUrl?: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
}

export interface JobStatusResponse {
  runId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  variants: VariantRender[];
  error?: string;
}
