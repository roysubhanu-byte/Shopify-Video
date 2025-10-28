import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IngestResponse, VariantPlan, VariantRender } from '../types/api';

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
  userId: string | null;

  setCredits: (credits: number) => void;
  setProductUrl: (url: string) => void;
  setProjectData: (data: IngestResponse) => void;
  setVariants: (variants: VariantPlan[]) => void;
  setRender: (variantId: string, render: VariantRender) => void;
  setCurrentRunId: (runId: string | null) => void;
  setOutputType: (outputType: 'video' | 'static') => void;
  setAdvancedMode: (advancedMode: boolean) => void;
  setUserId: (userId: string | null) => void;
  hydrateProjectId: () => void;
  resetProject: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      credits: 50,
      productUrl: '',
      projectId: null,
      productData: null,
      variants: [],
      renders: new Map(),
      currentRunId: null,
      outputType: null,
      advancedMode: false,
      userId: null,

      setCredits: (credits) => set({ credits }),

      setProductUrl: (url) => set({ productUrl: url }),

      setProjectData: (data) => {
        set({
          projectId: data.projectId,
          productData: data.productData,
        });
        // Also persist to localStorage directly for hydrateProjectId
        if (data.projectId) {
          localStorage.setItem('hoba_projectId', data.projectId);
        }
      },

      setVariants: (variants) => set({ variants }),

      setRender: (variantId, render) => set((state) => {
        const newRenders = new Map(state.renders);
        newRenders.set(variantId, render);
        return { renders: newRenders };
      }),

      setCurrentRunId: (runId) => set({ currentRunId: runId }),

      setOutputType: (outputType) => set({ outputType }),

      setAdvancedMode: (advancedMode) => set({ advancedMode }),

      setUserId: (userId) => set({ userId }),

      hydrateProjectId: () => {
        const stored = localStorage.getItem('hoba_projectId');
        if (stored && !get().projectId) {
          set({ projectId: stored });
        }
      },

      resetProject: () => {
        localStorage.removeItem('hoba_projectId');
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
    }),
    {
      name: 'hoba-store',
      partialize: (state) => ({
        projectId: state.projectId,
        userId: state.userId,
      }),
    }
  )
);
