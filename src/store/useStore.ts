// src/store/useStore.ts
import * as Zustand from 'zustand';
import type { IngestResponse, VariantPlan, VariantRender } from '../types/api';

// Works across ESM/CJS/various bundlers without using an illegal default import
const create: any = (Zustand as any).create ?? (Zustand as any).default;
if (typeof create !== 'function') {
  // Helpful error if bundler pulled a weird variant
  throw new Error('[store] zustand "create" was not found. Check your zustand version and imports.');
}

interface StoreState {
  credits: number;
  productUrl: string;
  projectId: string | null;
  productData: IngestResponse['productData'] | null;
  variants: VariantPlan[];
  renders: Map<string, VariantRender>;
  currentRunId: string | null;
  outputType: 'video' | 'static' | null;
  advancedMode: boolean;

  setCredits: (credits: number) => void;
  setProductUrl: (url: string) => void;
  setProjectData: (data: IngestResponse) => void;
  setVariants: (variants: VariantPlan[]) => void;
  setRender: (variantId: string, render: VariantRender) => void;
  setCurrentRunId: (runId: string | null) => void;
  setOutputType: (outputType: 'video' | 'static') => void;
  setAdvancedMode: (advancedMode: boolean) => void;
  resetProject: () => void;
}

export const useStore = create<StoreState>((set) => ({
  credits: 50,
  productUrl: '',
  projectId: null,
  productData: null,
  variants: [],
  renders: new Map(),
  currentRunId: null,
  outputType: null,
  advancedMode: false,

  setCredits: (credits) => set({ credits }),
  setProductUrl: (url) => set({ productUrl: url }),
  setProjectData: (data) => set({ projectId: data.projectId, productData: data.productData }),
  setVariants: (variants) => set({ variants }),

  setRender: (variantId, render) =>
    set((state) => {
      const next = new Map(state.renders);
      next.set(variantId, render);
      return { renders: next };
    }),

  setCurrentRunId: (runId) => set({ currentRunId: runId }),
  setOutputType: (outputType) => set({ outputType }),
  setAdvancedMode: (advancedMode) => set({ advancedMode }),

  resetProject: () =>
    set({
      productUrl: '',
      projectId: null,
      productData: null,
      variants: [],
      renders: new Map(),
      currentRunId: null,
      outputType: null,
      advancedMode: false,
    }),
}));
