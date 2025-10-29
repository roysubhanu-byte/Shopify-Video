import { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import { UrlForm } from '../components/UrlForm';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProductPickerModal } from '../components/ProductPickerModal';
import { BrandGuidelinesStep } from '../components/BrandGuidelinesStep';
import { OutputTypeStep } from '../components/OutputTypeStep';
import { CreationModeStep } from '../components/CreationModeStep';
import { HooksPanel } from '../components/HooksPanel';
import { ModeTabs } from '../components/ModeTabs';
import { ToastContainer } from '../components/Toast';
import AssetSelectionModal from '../components/AssetSelectionModal';
import StoryboardPreview from '../components/StoryboardPreview';
import { useUserCredits } from '../hooks/useUserCredits';
import { useStore } from '../store/useStore';
import { ingest, plan, renderPreviews, getJobStatus } from '../lib/api';
import { IngestResponse } from '../types/api';
import { i18n } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { API_URL } from '../lib/config';

interface Asset {
  id: string;
  url: string;
  type: 'product' | 'lifestyle' | 'detail';
  qualityScore: number;
  width: number;
  height: number;
}

type FlowStep =
  | 'url'
  | 'brand-guidelines'
  | 'asset-selection'
  | 'storyboard'
  | 'output-type'
  | 'creation-mode'
  | 'hooks'
  | 'concepts';

export function CreatePage() {
  const credits = useUserCredits();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<FlowStep>('url');
  const [isIngesting, setIsIngesting] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<{ url: string; vertical: string } | null>(null);
  const [brandTonePrompt, setBrandTonePrompt] = useState('');
  const [targetMarket, setTargetMarket] = useState('Global');
  const [creationMode, setCreationMode] = useState<'automated' | 'manual'>('automated');
  const [manualPrompt, setManualPrompt] = useState('');
  const [framework, setFramework] = useState<string | undefined>();
  const [customHooks, setCustomHooks] = useState<{ A?: string; B?: string; C?: string }>({});
  const [generatingStatic, setGeneratingStatic] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'info'; message: string }>>([]);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [creditError, setCreditError] = useState<{ needed: number; current: number } | null>(null);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [ctaText, setCtaText] = useState('Shop Now');

  const {
    projectId,
    productData,
    variants,
    renders,
    currentRunId,
    outputType,
    setProjectData,
    setVariants,
    setRender,
    setCurrentRunId,
    setOutputType,
    setAdvancedMode,
    setUserId,
    hydrateProjectId,
  } = useStore();

  // Ensure projectId is rehydrated on mount and fetch userId from auth
  useEffect(() => {
    hydrateProjectId();

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    };
    initAuth();
  }, [hydrateProjectId, setUserId]);

  const handleUrlSubmit = async (url: string, vertical: string) => {
    setPendingUrl({ url, vertical });
    setShowProductPicker(true);
  };

  const handleProductSelect = async (product: any) => {
    if (!pendingUrl) return;
    await processIngest(pendingUrl.url, pendingUrl.vertical, product);
  };

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast_${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    if (type !== 'error') setTimeout(() => removeToast(id), 5000);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const processIngest = async (url: string, _vertical: string, _selectedProduct: any) => {
    setIsIngesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addToast('error', 'Your session has expired. Please sign in again.');
        setTimeout(() => navigate('/signin'), 2000);
        return;
      }
      if (!url || url.trim().length === 0) {
        addToast('error', 'Please enter a valid product URL');
        return;
      }

      console.log('[Create] ingest →', url, 'userId:', session.user.id);
      const ingestData = await ingest({ url, userId: session.user.id }) as IngestResponse;
      console.log('[Create] ingest response:', ingestData);

      setProjectData(ingestData as any);

      const assets = (ingestData as any).assets;
      if (assets && Array.isArray(assets) && assets.length > 0) {
        console.log('[Create] Found assets:', assets.length);
        setAvailableAssets(assets);
      } else {
        console.log('[Create] No assets found in ingest response');
        setAvailableAssets([]);
      }

      setCurrentStep('brand-guidelines');
      if (assets && assets.length > 0) {
        addToast('success', `Product loaded with ${assets.length} images!`);
      } else {
        addToast('info', 'Product loaded - no images found');
      }
    } catch (error) {
      console.error('Error ingesting URL:', error);
      const errorMessage = error instanceof Error ? error.message : i18n.messages.error;
      if (errorMessage.toLowerCase().includes('sign in') || errorMessage.toLowerCase().includes('session')) {
        addToast('error', errorMessage);
        setTimeout(() => navigate('/signin'), 3000);
      } else {
        addToast('error', errorMessage);
      }
    } finally {
      setIsIngesting(false);
    }
  };

  const handleBrandGuidelinesComplete = (data: { brandTonePrompt: string; targetMarket: string }) => {
    setBrandTonePrompt(data.brandTonePrompt);
    setTargetMarket(data.targetMarket);
    console.log('[Create] Brand guidelines complete, available assets:', availableAssets.length);
    if (availableAssets.length > 0) {
      setCurrentStep('asset-selection');
    } else {
      console.log('[Create] No assets available, skipping to output-type');
      addToast('info', 'No product images found - proceeding without image selection');
      setCurrentStep('output-type');
    }
  };

  const handleAssetSelectionComplete = async () => {
    if (selectedAssets.length < 3) {
      addToast('error', 'Please select at least 3 images');
      return;
    }

    // Persist selected assets to database
    try {
      const pid = useStore.getState().projectId;
      if (!pid || !productData) {
        addToast('error', 'Project data not found');
        return;
      }

      // Show loading state
      addToast('info', 'Saving asset selection...');

      // Get product ID from project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('product_id')
        .eq('id', pid)
        .maybeSingle();

      if (projectError || !project?.product_id) {
        addToast('error', 'Product not found');
        console.error('Project fetch error:', projectError);
        return;
      }

      // First, unselect all assets for this product
      const { error: unselectError } = await supabase
        .from('product_assets')
        .update({ is_selected: false, display_order: 0 })
        .eq('product_id', project.product_id);

      if (unselectError) {
        console.error('Error unselecting assets:', unselectError);
        addToast('error', 'Failed to update asset selection');
        return;
      }

      // Then select the chosen assets with their display order - use Promise.all for atomicity
      const updatePromises = selectedAssets.map((asset, i) =>
        supabase
          .from('product_assets')
          .update({ is_selected: true, display_order: i })
          .eq('id', asset.id)
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        console.error('Errors selecting assets:', errors);
        addToast('error', 'Some assets failed to save');
        return;
      }

      // Verify assets were saved by re-fetching
      const { data: verifyAssets, error: verifyError } = await supabase
        .from('product_assets')
        .select('id')
        .eq('product_id', project.product_id)
        .eq('is_selected', true);

      if (verifyError || !verifyAssets || verifyAssets.length < 3) {
        console.error('Asset verification failed:', verifyError, 'count:', verifyAssets?.length);
        addToast('error', 'Asset selection verification failed. Please try again.');
        return;
      }

      console.log('[CreatePage] Assets saved and verified:', verifyAssets.length);
      addToast('success', `${selectedAssets.length} images selected and saved`);
      setCurrentStep('storyboard');
    } catch (error) {
      console.error('Error saving asset selection:', error);
      addToast('error', 'Failed to save asset selection');
    }
  };

  const handleStoryboardComplete = () => setCurrentStep('output-type');

  const handleOutputTypeComplete = (data: { outputType: 'video' | 'static'; advancedMode?: boolean }) => {
    if (data.advancedMode) {
      setAdvancedMode(true);
      navigate('/prompt');
      return;
    }
    setOutputType(data.outputType);
    setCurrentStep('creation-mode');
  };

  const handleCreationModeComplete = (data: {
    creationMode: 'automated' | 'manual';
    manualPrompt?: string;
    framework?: string;
  }) => {
    setCreationMode(data.creationMode);
    setManualPrompt(data.manualPrompt || '');
    setFramework(data.framework);
    if (data.creationMode === 'automated') setCurrentStep('hooks');
    else {
      setCurrentStep('concepts');
      handleGeneratePlans();
    }
  };

  const handleGeneratePlans = async () => {
    // Make sure projectId exists (re-hydrate if needed)
    if (!useStore.getState().projectId) {
      hydrateProjectId();
    }
    const pid = useStore.getState().projectId;
    const uid = useStore.getState().userId;

    if (!pid) {
      addToast('error', 'No project found. Please paste a product URL first.');
      return;
    }

    if (!uid) {
      addToast('error', 'User session expired. Please sign in again.');
      setTimeout(() => navigate('/signin'), 2000);
      return;
    }

    // Pre-flight validation: Check if we have required data
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('product_id, brand_kit_id')
        .eq('id', pid)
        .maybeSingle();

      if (!project) {
        addToast('error', 'Project not found. Please start over.');
        setCurrentStep('url');
        return;
      }

      if (!project.product_id) {
        addToast('error', 'Product data missing. Please start over.');
        setCurrentStep('url');
        return;
      }

      if (!project.brand_kit_id) {
        addToast('error', 'Brand guidelines missing. Please complete brand setup.');
        setCurrentStep('brand-guidelines');
        return;
      }

      // Check if we have selected assets - with retry logic
      let assetCount = 0;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        const { data: assets, error: assetsError } = await supabase
          .from('product_assets')
          .select('id')
          .eq('product_id', project.product_id)
          .eq('is_selected', true);

        if (assetsError) {
          console.error('[Create] Error fetching assets:', assetsError);
          retries++;
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
        }

        assetCount = assets?.length || 0;
        break;
      }

      console.log('[Create] Pre-flight check - selected assets:', assetCount, 'after', retries, 'retries');

      if (assetCount < 3 && availableAssets.length >= 3) {
        addToast('error', `Please select at least 3 images (currently: ${assetCount})`);
        setCurrentStep('asset-selection');
        return;
      } else if (assetCount < 3 && availableAssets.length < 3) {
        addToast('info', 'Not enough product images available. Continuing without asset selection.');
        console.log('[Create] Proceeding without assets - only', availableAssets.length, 'available');
      }
    } catch (error) {
      console.error('[Create] Pre-flight validation error:', error);
      addToast('error', 'Failed to validate project data');
      return;
    }

    setIsPlanning(true);
    setCurrentStep('concepts');

    try {
      await plan({
        projectId: pid,
        userId: uid,
        overrideHookA: customHooks.A,
        overrideHookB: customHooks.B,
        overrideHookC: customHooks.C,
        brandTonePrompt,
        targetMarket,
        creationMode,
        manualPrompt: creationMode === 'manual' ? manualPrompt : undefined,
        framework: creationMode === 'manual' ? framework : undefined,
      });

      const variantsResponse = await supabase
        .from('variants')
        .select('*')
        .eq('project_id', pid);

      if (variantsResponse.error) {
        console.warn('[Create] variants fetch error:', variantsResponse.error);
      }

      if (variantsResponse.data) {
        setVariants(variantsResponse.data as any);
      }
    } catch (error: any) {
      console.error('[Create] plan error:', error);
      const errorMessage = error?.message || i18n.messages.error;

      // Check if this is an asset selection error
      if (errorMessage.includes('3 assets') || errorMessage.includes('images')) {
        addToast('error', 'Asset selection issue detected. Redirecting to asset selection...');
        if (availableAssets.length >= 3) {
          setCurrentStep('asset-selection');
        } else {
          addToast('info', 'Not enough images available to proceed');
          setCurrentStep(creationMode === 'automated' ? 'hooks' : 'creation-mode');
        }
      } else {
        addToast('error', errorMessage);
        setCurrentStep(creationMode === 'automated' ? 'hooks' : 'creation-mode');
      }
    } finally {
      setIsPlanning(false);
    }
  };

  const handleCreatePreviews = async () => {
    const pid = useStore.getState().projectId;
    const uid = useStore.getState().userId;

    if (!pid || variants.length === 0) return;

    if (!uid) {
      addToast('error', 'User session expired. Please sign in again.');
      setTimeout(() => navigate('/signin'), 2000);
      return;
    }

    setIsRendering(true);

    try {
      const response = await renderPreviews({
        projectId: pid,
        userId: uid,
      });
      setCurrentRunId(response.runId);
    } catch (error) {
      console.error('Error starting previews:', error);
      const errorMessage = error instanceof Error ? error.message : i18n.messages.error;

      // Check for API key errors
      if (errorMessage.toLowerCase().includes('google') || errorMessage.toLowerCase().includes('gemini') || errorMessage.toLowerCase().includes('veo')) {
        addToast('error', 'Video generation requires Google API keys. Please configure GOOGLE_API_KEY, GEMINI_API_KEY, or GOOGLE_VEO3_API_KEY in your API environment.');
      } else {
        addToast('error', errorMessage);
      }
      setIsRendering(false);
    }
  };

  const handleGenerateStatic = async (variantId: string) => {
    const uid = useStore.getState().userId;

    if (!uid) {
      addToast('error', 'User session expired. Please sign in again.');
      setTimeout(() => navigate('/signin'), 2000);
      return;
    }

    setGeneratingStatic(prev => new Set(prev).add(variantId));

    try {
      const response = await fetch(`${API_URL || ''}/api/render/static`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, userId: uid }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate static images: ${response.statusText}`);
      }

      const result = await response.json();
      addToast('success', 'Static images generated successfully!');

      // Update the variant with the new static images if provided
      if (result.staticImages) {
        const updatedVariants = variants.map(v =>
          v.id === variantId ? { ...v, staticImages: result.staticImages } : v
        );
        setVariants(updatedVariants);
      }
    } catch (error) {
      console.error('Error generating static images:', error);
      addToast('error', error instanceof Error ? error.message : 'Failed to generate static images');
    } finally {
      setGeneratingStatic(prev => {
        const next = new Set(prev);
        next.delete(variantId);
        return next;
      });
    }
  };

  useEffect(() => {
    if (!currentRunId || !isRendering) return;
    const poll = setInterval(async () => {
      try {
        const status = await getJobStatus(currentRunId);
        status.variants.forEach((variantData: any) => setRender(variantData.variantId, variantData));
        if (status.status === 'succeeded' || status.status === 'failed') {
          setIsRendering(false);
          setCurrentRunId(null);
          clearInterval(poll);
        }
      } catch (e) {
        console.error('Error polling job status:', e);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [currentRunId, isRendering, setRender, setCurrentRunId]);

  const hasValidRenders = variants.some(v => {
    const r = renders.get(v.id);
    return r?.status === 'succeeded' && r?.videoUrl;
  });

  const conceptsData = variants.map(v => {
    const r = renders.get(v.id);
    return {
      id: v.id,
      tag: (v as any).concept_tag || (v as any).conceptTag,
      type: (v as any).concept_type || (v as any).conceptType,
      hook: v.hook || '',
      videoUrl: r?.videoUrl,
      staticImages: (v as any).static_images || (v as any).staticImages || [],
    };
  });

  const renderStepIndicator = () => {
    const steps = [
      { id: 'url', label: 'Product' },
      { id: 'brand-guidelines', label: 'Brand' },
      ...(availableAssets.length > 0 ? [
        { id: 'asset-selection', label: 'Images' },
        { id: 'storyboard', label: 'Storyboard' },
      ] : []),
      { id: 'output-type', label: 'Output' },
      { id: 'creation-mode', label: 'Mode' },
      ...(creationMode === 'automated' ? [{ id: 'hooks', label: 'Hooks' }] : []),
      { id: 'concepts', label: 'Create' },
    ];
    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
      <div className="flex items-center justify-center gap-4 mb-12">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                index < currentIndex
                  ? 'bg-green-500 text-white'
                  : index === currentIndex
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {index < currentIndex ? '✓' : index + 1}
              </div>
              <span className={`text-sm font-medium ${index <= currentIndex ? 'text-white' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 ${index < currentIndex ? 'bg-green-500' : 'bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-12">
        {currentStep !== 'url' && projectId && (
          <div className="mb-8">
            <button
              onClick={() => {
                if (currentStep === 'brand-guidelines') setCurrentStep('url');
                else if (currentStep === 'asset-selection') setCurrentStep('brand-guidelines');
                else if (currentStep === 'storyboard') setCurrentStep('asset-selection');
                else if (currentStep === 'output-type') {
                  if (availableAssets.length > 0) setCurrentStep('storyboard');
                  else setCurrentStep('brand-guidelines');
                } else if (currentStep === 'creation-mode') setCurrentStep('output-type');
                else if (currentStep === 'hooks') setCurrentStep('creation-mode');
                else if (currentStep === 'concepts' && creationMode === 'automated') setCurrentStep('hooks');
                else if (currentStep === 'concepts' && creationMode === 'manual') setCurrentStep('creation-mode');
              }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
              Back
            </button>
          </div>
        )}

        {projectId && currentStep !== 'url' && renderStepIndicator()}

        {currentStep === 'url' ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="text-center mb-12 max-w-3xl">
              <h1 className="text-5xl font-bold text-white mb-4">Create Your Video Ads</h1>
              <p className="text-xl text-slate-400 mb-8">
                Paste your product URL and get AI-generated video concepts with intelligent prompts
              </p>
            </div>
            <UrlForm onSubmit={handleUrlSubmit} isLoading={isIngesting} productData={productData} />
          </div>
        ) : currentStep === 'brand-guidelines' ? (
          <BrandGuidelinesStep
            onComplete={handleBrandGuidelinesComplete}
            initialBrandTone={brandTonePrompt}
            initialTargetMarket={targetMarket}
          />
        ) : currentStep === 'asset-selection' ? (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Select Product Images</h2>
              <p className="text-slate-400">Choose 3-5 images for your video storyboard</p>
            </div>
            {availableAssets.length === 0 ? (
              <div className="bg-slate-900 rounded-xl p-12 border border-slate-800 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Images Available</h3>
                  <p className="text-slate-400 mb-6 max-w-md">
                    We couldn't find any product images from the URL you provided. You can continue without images or go back to try a different product.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCurrentStep('url')}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Try Different Product
                    </button>
                    <button
                      onClick={() => setCurrentStep('output-type')}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Continue Without Images
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
                  <div className="mb-6">
                    <p className="text-white font-semibold mb-2">Available Images: {availableAssets.length}</p>
                    <p className="text-slate-400 text-sm">Selected: {selectedAssets.length}</p>
                  </div>
                  <button
                    onClick={() => setShowAssetModal(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {selectedAssets.length > 0 ? 'Change Selection' : 'Select Images'}
                  </button>
                  {selectedAssets.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedAssets.map((asset, index) => (
                        <div key={asset.id} className="relative">
                          <img src={asset.url} alt={`Selected ${index + 1}`} className="w-full h-32 object-cover rounded-lg border-2 border-blue-500" />
                          <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setCurrentStep('output-type')}
                    className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
                  >
                    Skip Image Selection
                  </button>
                  <button
                    onClick={handleAssetSelectionComplete}
                    disabled={selectedAssets.length < 3}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-3 text-lg"
                  >
                    Continue to Storyboard <ArrowRight size={20} />
                  </button>
                </div>
              </>
            )}
          </div>
        ) : currentStep === 'storyboard' ? (
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
              <StoryboardPreview
                assets={selectedAssets}
                hook={customHooks.A || variants[0]?.hook}
                productName={(productData as any)?.title}
                onReorder={setSelectedAssets}
                onEditAssets={() => setShowAssetModal(true)}
                ctaText={ctaText}
                onCtaTextChange={setCtaText}
              />
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleStoryboardComplete}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-3 text-lg"
              >
                Looks Good - Continue <ArrowRight size={20} />
              </button>
            </div>
          </div>
        ) : currentStep === 'output-type' ? (
          <OutputTypeStep onComplete={handleOutputTypeComplete} initialOutputType={outputType || undefined} />
        ) : currentStep === 'creation-mode' ? (
          <CreationModeStep productData={productData} onComplete={handleCreationModeComplete} outputType={outputType || 'video'} />
        ) : currentStep === 'hooks' ? (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Choose Hooks for Your Concepts</h2>
              <p className="text-slate-400">Select trending hooks or create custom ones (optional)</p>
            </div>
            <HooksPanel vertical={(productData as any)?.vertical || 'general'} onCustomHooksChange={setCustomHooks} />
            <div className="flex justify-center">
              <button
                onClick={handleGeneratePlans}
                disabled={isPlanning}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-3 text-lg"
              >
                {isPlanning ? 'Generating Plans…' : <>Generate 3 Concepts <ArrowRight size={20} /></>}
              </button>
            </div>
          </div>
        ) : currentStep === 'concepts' ? (
          <div>
            {isPlanning ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-400">
                  {creationMode === 'manual' ? 'Creating your custom video concept…' : 'Generating 3 concepts…'}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {creationMode === 'manual' ? 'Your Video Concept' : 'Your 3 Video Concepts'}
                  </h2>
                  <p className="text-slate-400">Choose between video previews or instant static images</p>
                </div>
                <ModeTabs
                  conceptsData={conceptsData}
                  onGenerateStatic={handleGenerateStatic}
                  generatingStatic={generatingStatic}
                  creditsEnabled={typeof credits === 'number'}
                />
                {!hasValidRenders && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleCreatePreviews}
                      disabled={isRendering}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-3 text-lg"
                    >
                      {isRendering ? i18n.messages.rendering : <>{i18n.cta.create3} <ArrowRight size={20} /></>}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}
      </div>

      <ProductPickerModal
        open={showProductPicker}
        shopUrl={pendingUrl?.url || ''}
        onClose={() => { setShowProductPicker(false); setPendingUrl(null); }}
        onSelect={handleProductSelect}
      />

      {selectedVideo && <VideoPlayer videoUrl={selectedVideo} onClose={() => setSelectedVideo(null)} />}

      <AssetSelectionModal
        isOpen={showAssetModal}
        assets={availableAssets}
        selectedAssets={selectedAssets}
        onClose={() => setShowAssetModal(false)}
        onConfirm={(selected) => { setSelectedAssets(selected); setShowAssetModal(false); }}
        minSelection={3}
        maxSelection={5}
      />

      {showCreditDialog && creditError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Insufficient Credits</h3>
            <p className="text-gray-700 mb-6">
              You need {creditError.needed} credits to generate static images, but you only have {creditError.current} credits remaining.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreditDialog(false);
                  setCreditError(null);
                  navigate('/billing');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Buy Credits
              </button>
              <button
                onClick={() => {
                  setShowCreditDialog(false);
                  setCreditError(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
