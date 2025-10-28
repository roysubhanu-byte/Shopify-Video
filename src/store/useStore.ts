// src/store/useStore.ts
import { create } from 'zustand';
import type { IngestResponse, VariantPlan, VariantRender } from '../types/api';

// LocalStorage keys
const LS = {
  projectId: 'sv_projectId',
  productData: 'sv_productData',
  productUrl: 'sv_productUrl',
  outputType: 'sv_outputType',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function safeSet(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
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
  // hydrate from localStorage
  credits: 50,
  productUrl: safeGet<string>(LS.productUrl, ''),
  projectId: safeGet<string | null>(LS.projectId, null),
  productData: safeGet<any>(LS.productData, null),
  variants: [],
  renders: new Map(),
  currentRunId: null,
  outputType: safeGet<'video' | 'static' | null>(LS.outputType, null),
  advancedMode: false,

  setCredits: (credits) => set({ credits }),

  setProductUrl: (url) => {
    safeSet(LS.productUrl, url);
    set({ productUrl: url });
  },

  // When ingest succeeds, persist projectId + productData
  setProjectData: (data) => {
    safeSet(LS.projectId, data.projectId);
    safeSet(LS.productData, data.productData);
    set({
      projectId: data.projectId,
      productData: data.productData,
    });
  },

  setVariants: (variants) => set({ variants }),

  setRender: (variantId, render) =>
    set((state) => {
      const newRenders = new Map(state.renders);
      newRenders.set(variantId, render);
      return { renders: newRenders };
    }),

  setCurrentRunId: (runId) => set({ currentRunId: runId }),

  setOutputType: (outputType) => {
    safeSet(LS.outputType, outputType);
    set({ outputType });
  },

  setAdvancedMode: (advancedMode) => set({ advancedMode }),

  // Clear both state and localStorage
  resetProject: () => {
    safeRemove(LS.projectId);
    safeRemove(LS.productData);
    safeRemove(LS.productUrl);
    set({
      productUrl: '',
      projectId: null,
      productData: null,
      variants: [],
      renders: new Map(),
      currentRunId: null,
      outputType: null,
      advancedMode: false,
    });
  },
}));
