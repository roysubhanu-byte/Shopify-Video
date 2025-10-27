import { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import { UrlForm } from '../components/UrlForm';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProductPickerModal } from '../components/ProductPickerModal';
import { BrandGuidelinesStep } from '../components/BrandGuidelinesStep';
import { CreationModeStep } from '../components/CreationModeStep';
import { HooksPanel } from '../components/HooksPanel';
import { ModeTabs } from '../components/ModeTabs';
import { ToastContainer } from '../components/Toast';
import AssetSelectionModal from '../components/AssetSelectionModal';
import StoryboardPreview from '../components/StoryboardPreview';
import { useUserCredits } from '../hooks/useUserCredits';
import { useStore } from '../store/useStore';
import { ingest, plan, renderPreviews, getJobStatus } from '../lib/api';
import { i18n } from '../lib/i18n';
import { supabase } from '../lib/supabase';

interface Asset {
  id: string;
  url: string;
  type: 'product' | 'lifestyle' | 'detail';
  qualityScore: number;
  width: number;
  height: number;
}

type FlowStep = 'url' | 'brand-guidelines' | 'asset-selection' | 'storyboard' | 'creation-mode' | 'hooks' | 'concepts';

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

  const {
    projectId,
    productData,
    variants,
    renders,
    currentRunId,
    setProjectData,
    setVariants,
    setRender,
    setCurrentRunId,
  } = useStore();

  const isShopifyUrl = (url: string): boolean => {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('myshopify.com') || lowerUrl.includes('.shopify.com');
  };

  const handleUrlSubmit = async (url: string, vertical: string) => {
    if (isShopifyUrl(url)) {
      setPendingUrl({ url, vertical });
      setShowProductPicker(true);
      return;
    }

    await processIngest(url, vertical, null);
  };

  const handleProductSelect = async (product: any) => {
    if (!pendingUrl) return;

    await processIngest(pendingUrl.url, pendingUrl.vertical, product);
  };

  const processIngest = async (url: string, _vertical: string, _selectedProduct: any) => {
    setIsIngesting(true);

    try {
      const ingestData = await ingest(url);
      setProjectData(ingestData);

      if ((ingestData as any).assets && Array.isArray((ingestData as any).assets)) {
        setAvailableAssets((ingestData as any).assets);
      }

      setCurrentStep('brand-guidelines');
    } catch (error) {
      console.error('Error:', error);
      alert(i18n.messages.error);
      setIsIngesting(false);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleBrandGuidelinesComplete = (data: { brandTonePrompt: string; targetMarket: string }) => {
    setBrandTonePrompt(data.brandTonePrompt);
    setTargetMarket(data.targetMarket);

    if (availableAssets.length > 0) {
      setCurrentStep('asset-selection');
    } else {
      setCurrentStep('creation-mode');
    }
  };

  const handleAssetSelectionComplete = () => {
    if (selectedAssets.length >= 3) {
      setCurrentStep('storyboard');
    } else {
      addToast('error', 'Please select at least 3 images');
    }
  };

  const handleStoryboardComplete = () => {
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
    if (data.creationMode === 'automated') {
      setCurrentStep('hooks');
    } else {
      setCurrentStep('concepts');
      handleGeneratePlans();
    }
  };

  const handleGeneratePlans = async () => {
    if (!projectId) return;

    setIsPlanning(true);
    setCurrentStep('concepts');

    try {
      const planData = await plan(projectId, {
        A: customHooks.A,
        B: customHooks.B,
        C: customHooks.C,
        brandTonePrompt,
        targetMarket,
        creationMode,
        manualPrompt: creationMode === 'manual' ? manualPrompt : undefined,
        framework: creationMode === 'manual' ? framework : undefined,
      });

      const variantsResponse = await supabase
        .from('variants')
        .select('*')
        .eq('project_id', projectId);

      if (variantsResponse.data) {
        setVariants(variantsResponse.data as any);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(i18n.messages.error);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleCreatePreviews = async () => {
    if (!projectId || variants.length === 0) return;

    setIsRendering(true);

    try {
      const response = await renderPreviews({
        projectId,
        variantIds: variants.map(v => v.id),
        mode: 'preview',
      });

      setCurrentRunId(response.runId);
    } catch (error) {
      console.error('Error:', error);
      alert(i18n.messages.error);
      setIsRendering(false);
    }
  };

  useEffect(() => {
    if (!currentRunId || !isRendering) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await getJobStatus(currentRunId);

        status.variants.forEach(variantRender => {
          setRender(variantRender.variantId, variantRender);
        });

        if (status.status === 'succeeded' || status.status === 'failed') {
          setIsRendering(false);
          setCurrentRunId(null);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [currentRunId, isRendering, setRender, setCurrentRunId]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast_${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleGenerateStatic = async (variantId: string, conceptTag: string) => {
    setGeneratingStatic(prev => new Set(prev).add(variantId));
    addToast('info', `Generating images for Concept ${conceptTag}...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch('/api/render/static', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, userId: user?.id }),
      });

      const data = await response.json();

      if (response.status === 402) {
        setCreditError({ needed: data.needed, current: data.current });
        setShowCreditDialog(true);
        addToast('error', 'Insufficient credits to generate images');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate images');
      }

      if (data.success && data.imageUrls) {
        const updatedVariants = variants.map(v =>
          v.id === variantId ? { ...v, staticImages: data.imageUrls } : v
        );
        setVariants(updatedVariants);
        addToast('success', `Ready – ${data.count} images created for Concept ${conceptTag}`);
      }
    } catch (error) {
      console.error('Error generating static images:', error);
      addToast('error', error instanceof Error ? error.message : 'Failed to generate static images');
    } finally {
      setGeneratingStatic(prev => {
        const newSet = new Set(prev);
        newSet.delete(variantId);
        return newSet;
      });
    }
  };

  const hasValidRenders = variants.some(v => {
    const render = renders.get(v.id);
    return render?.status === 'succeeded' && render?.videoUrl;
  });

  const conceptsData = variants.map(v => {
    const render = renders.get(v.id);
    return {
      id: v.id,
      tag: (v as any).concept_tag || (v as any).conceptTag,
      type: (v as any).concept_type || (v as any).conceptType,
      hook: v.hook || '',
      videoUrl: render?.videoUrl,
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
              <span className={`text-sm font-medium ${
                index <= currentIndex ? 'text-white' : 'text-slate-500'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 ${
                index < currentIndex ? 'bg-green-500' : 'bg-slate-700'
              }`} />
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
                else if (currentStep === 'creation-mode') {
                  if (availableAssets.length > 0) setCurrentStep('storyboard');
                  else setCurrentStep('brand-guidelines');
                }
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
              <h1 className="text-5xl font-bold text-white mb-4">
                Create Your Video Ads
              </h1>

              <p className="text-xl text-slate-400 mb-8">
                Paste your product URL and get AI-generated video concepts with intelligent prompts
              </p>
            </div>

            <UrlForm
              onSubmit={handleUrlSubmit}
              isLoading={isIngesting}
              productData={productData}
            />
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
              <h2 className="text-3xl font-bold text-white mb-2">
                Select Product Images
              </h2>
              <p className="text-slate-400">
                Choose 3-5 images for your video storyboard
              </p>
            </div>

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
                      <img
                        src={asset.url}
                        alt={`Selected ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-blue-500"
                      />
                      <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleAssetSelectionComplete}
                disabled={selectedAssets.length < 3}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-3 text-lg"
              >
                Continue to Storyboard
                <ArrowRight size={20} />
              </button>
            </div>
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
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleStoryboardComplete}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-3 text-lg"
              >
                Looks Good - Continue
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        ) : currentStep === 'creation-mode' ? (
          <CreationModeStep
            productData={productData}
            onComplete={handleCreationModeComplete}
          />
        ) : currentStep === 'hooks' ? (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Choose Hooks for Your Concepts
              </h2>
              <p className="text-slate-400">
                Select trending hooks or create custom ones (optional)
              </p>
            </div>

            <HooksPanel
              vertical={(productData as any)?.vertical || 'general'}
              onCustomHooksChange={setCustomHooks}
            />

            <div className="flex justify-center">
              <button
                onClick={handleGeneratePlans}
                disabled={isPlanning}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-3 text-lg"
              >
                {isPlanning ? (
                  'Generating Plans...'
                ) : (
                  <>
                    Generate 3 Concepts
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : currentStep === 'concepts' ? (
          <div>
            {isPlanning ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-400">
                  {creationMode === 'manual' ? 'Creating your custom video concept...' : 'Generating 3 concepts...'}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {creationMode === 'manual' ? 'Your Video Concept' : 'Your 3 Video Concepts'}
                  </h2>
                  <p className="text-slate-400">
                    Choose between video previews or instant static images
                  </p>
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
                      {isRendering ? (
                        i18n.messages.rendering
                      ) : (
                        <>
                          {i18n.cta.create3}
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {hasValidRenders && (
                  <div className="flex justify-center mt-8">
                    <button
                      className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors flex items-center gap-3 text-lg"
                    >
                      Create Final Videos (3 credits)
                      <ArrowRight size={20} />
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
        onClose={() => {
          setShowProductPicker(false);
          setPendingUrl(null);
        }}
        onSelect={handleProductSelect}
      />

      {selectedVideo && (
        <VideoPlayer
          videoUrl={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      <AssetSelectionModal
        isOpen={showAssetModal}
        assets={availableAssets}
        selectedAssets={selectedAssets}
        onClose={() => setShowAssetModal(false)}
        onConfirm={(selected) => {
          setSelectedAssets(selected);
          setShowAssetModal(false);
        }}
        minSelection={3}
        maxSelection={5}
      />

      {showCreditDialog && creditError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Insufficient Credits</h3>
            <p className="text-gray-700 mb-6">
              You need {creditError.needed} credits to generate static images, but you only have{' '}
              {creditError.current} credits remaining.
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
