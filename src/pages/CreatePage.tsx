import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import { UrlForm } from '../components/UrlForm';
import { ConceptTile } from '../components/ConceptTile';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProductPickerModal } from '../components/ProductPickerModal';
import { HooksPanel } from '../components/HooksPanel';
import { ModeTabs } from '../components/ModeTabs';
import { ToastContainer } from '../components/Toast';
import { useUserCredits } from '../hooks/useUserCredits';
import { useStore } from '../store/useStore';
import { ingest, plan, renderPreviews, getJobStatus } from '../lib/api';
import { i18n } from '../lib/i18n';
import { supabase } from '../lib/supabase';

export function CreatePage() {
  const { credits } = useUserCredits();
  const navigate = useNavigate();

  const [isIngesting, setIsIngesting] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<{ url: string; vertical: string } | null>(null);
  const [customHooks, setCustomHooks] = useState<{ A?: string; B?: string; C?: string }>({});
  const [generatingStatic, setGeneratingStatic] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'info'; message: string }>>([]);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [creditError, setCreditError] = useState<{ needed: number; current: number } | null>(null);

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

  const processIngest = async (url: string, vertical: string, selectedProduct: any) => {
    setIsIngesting(true);

    try {
      const ingestData = await ingest(url);
      setProjectData(ingestData);
    } catch (error) {
      console.error('Error:', error);
      alert(i18n.messages.error);
      setIsIngesting(false);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleGeneratePlans = async () => {
    if (!projectId) return;

    setIsPlanning(true);

    try {
      const planData = await plan(projectId, customHooks);
      setVariants(planData.variants);
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
      tag: v.conceptTag,
      type: v.conceptType,
      hook: v.hook,
      videoUrl: render?.videoUrl,
      staticImages: v.staticImages,
    };
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-12">
        {!projectId ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="text-center mb-12 max-w-3xl">
              <h1 className="text-5xl font-bold text-white mb-4">
                Create Your Video Ads
              </h1>

              <p className="text-xl text-slate-400 mb-8">
                Paste your product URL and get 3 distinct video concepts with trending hooks
              </p>
            </div>

            <UrlForm
              onSubmit={handleUrlSubmit}
              isLoading={isIngesting}
              productData={productData}
            />
          </div>
        ) : variants.length === 0 ? (
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
              vertical={productData?.vertical || 'general'}
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
                    Generate Hooks
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Your 3 Video Concepts
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
          </div>
        )}
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
