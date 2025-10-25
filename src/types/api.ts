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

export interface ScriptBeat {
  text: string;
  duration: number;
}

export interface Overlay {
  text: string;
  timestamp: number;
}

export interface PromptPlanRequest {
  freeText: string;
  aspect?: '9:16' | '1:1' | '16:9';
  duration?: number;
  tone?: 'casual' | 'professional' | 'energetic' | 'calm';
}

export interface PromptPlanResponse {
  promptId: string;
  hook: string;
  scriptBeats: ScriptBeat[];
  overlays: Overlay[];
  voiceId: string;
  estimatedDuration: number;
}

export interface PromptRenderRequest {
  promptId: string;
  mode: 'preview' | 'final';
  idempotencyKey: string;
}

export interface PromptRenderResponse {
  runId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface PromptJobStatusResponse {
  runId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  srtUrl?: string;
  error?: string;
}

export interface CustomPrompt {
  id: string;
  userId: string;
  title: string;
  aspect: '9:16' | '1:1' | '16:9';
  duration: number;
  tone: string;
  hookTemplate: string;
  scriptBeats: ScriptBeat[];
  overlays: Overlay[];
  voiceId: string;
  seed: number;
  assetUrls: string[];
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: 'hook' | 'script' | 'overlay';
  content: string;
  popularityScore: number;
  isActive: boolean;
}
