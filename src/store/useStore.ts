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
  isAuthenticated: boolean;
  lastSyncTimestamp: number | null;

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
  validateState: () => { valid: boolean; errors: string[] };
  recoverState: () => Promise<boolean>;
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
      isAuthenticated: false,
      lastSyncTimestamp: null,

      setCredits: (credits) => set({ credits }),

      setProductUrl: (url) => set({ productUrl: url }),

      setProjectData: (data) => {
        console.log('[Store] Setting project data:', {
          projectId: data.projectId,
          hasProductData: !!data.productData,
        });

        set({
          projectId: data.projectId,
          productData: data.productData,
          lastSyncTimestamp: Date.now(),
        });

        // Also persist to localStorage directly for hydrateProjectId
        if (data.projectId) {
          localStorage.setItem('hoba_projectId', data.projectId);
          localStorage.setItem('hoba_lastSync', Date.now().toString());
        }
      },

      setVariants: (variants) => {
        console.log('[Store] Setting variants:', { count: variants.length });
        set({ variants, lastSyncTimestamp: Date.now() });
      },

      setRender: (variantId, render) => set((state) => {
        const newRenders = new Map(state.renders);
        newRenders.set(variantId, render);
        return { renders: newRenders };
      }),

      setCurrentRunId: (runId) => set({ currentRunId: runId }),

      setOutputType: (outputType) => set({ outputType }),

      setAdvancedMode: (advancedMode) => set({ advancedMode }),

      setUserId: (userId) => {
        console.log('[Store] Setting userId:', userId ? 'present' : 'null');
        set({ userId });
      },

      hydrateProjectId: () => {
        const stored = localStorage.getItem('hoba_projectId');
        const lastSync = localStorage.getItem('hoba_lastSync');

        if (stored && !get().projectId) {
          const syncAge = lastSync ? Date.now() - parseInt(lastSync, 10) : Infinity;
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours

          if (syncAge < maxAge) {
            console.log('[Store] Hydrating projectId from localStorage:', stored);
            set({ projectId: stored });
          } else {
            console.log('[Store] Stored projectId is stale, clearing...');
            localStorage.removeItem('hoba_projectId');
            localStorage.removeItem('hoba_lastSync');
          }
        }
      },

      validateState: () => {
        const state = get();
        const errors: string[] = [];

        // Check for incomplete state
        if (state.projectId && !state.productData) {
          errors.push('Project ID exists but product data is missing');
        }

        if (state.productData && !state.projectId) {
          errors.push('Product data exists but project ID is missing');
        }

        // Check for stale data
        if (state.lastSyncTimestamp) {
          const age = Date.now() - state.lastSyncTimestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          if (age > maxAge) {
            errors.push('State data is stale (older than 24 hours)');
          }
        }

        // Check for renders without variants
        if (state.renders.size > 0 && state.variants.length === 0) {
          errors.push('Renders exist but no variants found');
        }

        console.log('[Store] State validation:', {
          valid: errors.length === 0,
          errors,
        });

        return {
          valid: errors.length === 0,
          errors,
        };
      },

      recoverState: async () => {
        const state = get();

        console.log('[Store] Attempting state recovery...');

        // If we have a projectId but missing data, clear everything
        if (state.projectId && (!state.productData || state.variants.length === 0)) {
          console.log('[Store] Incomplete state detected, resetting...');
          get().resetProject();
          return false;
        }

        // If state is valid, nothing to recover
        const validation = get().validateState();
        if (validation.valid) {
          console.log('[Store] State is valid, no recovery needed');
          return true;
        }

        // If state is invalid and can't be recovered, reset
        console.log('[Store] State is invalid and cannot be recovered, resetting...');
        get().resetProject();
        return false;
      },

      resetProject: () => {
        console.log('[Store] Resetting project state');
        localStorage.removeItem('hoba_projectId');
        localStorage.removeItem('hoba_lastSync');
        set({
          productUrl: '',
          projectId: null,
          productData: null,
          variants: [],
          renders: new Map(),
          currentRunId: null,
          outputType: null,
          advancedMode: false,
          lastSyncTimestamp: null,
        });
      },
    }),
    {
      name: 'hoba-store',
      partialize: (state) => ({
        projectId: state.projectId,
        userId: state.userId,
        lastSyncTimestamp: state.lastSyncTimestamp,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[Store] Rehydrated from localStorage:', {
            projectId: state.projectId,
            userId: state.userId ? 'present' : 'null',
            lastSync: state.lastSyncTimestamp
              ? new Date(state.lastSyncTimestamp).toISOString()
              : 'never',
          });

          // Validate state after rehydration
          const validation = state.validateState();
          if (!validation.valid) {
            console.warn('[Store] Invalid state after rehydration:', validation.errors);
            state.recoverState();
          }
        }
      },
    }
  )
);
