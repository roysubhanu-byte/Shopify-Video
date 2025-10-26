import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { UrlForm } from '../components/UrlForm';
import { ConceptTile } from '../components/ConceptTile';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProductPickerModal } from '../components/ProductPickerModal';
import { HooksPanel } from '../components/HooksPanel';
import { ModeTabs } from '../components/ModeTabs';
import { useUserCredits } from '../hooks/useUserCredits';
import { useStore } from '../store/useStore';
import { ingest, plan, renderPreviews, getJobStatus } from '../lib/api';
import { i18n } from '../lib/i18n';

export function CreatePage() {
  useUserCredits();

  const [isIngesting, setIsIngesting] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<{ url: string; vertical: string } | null>(null);
  const [customHooks, setCustomHooks] = useState<{ A?: string; B?: string; C?: string }>({});
  const [generatingStatic, setGeneratingStatic] = useState<Set<string>>(new Set());

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

  const handleGenerateStatic = async (variantId: string, conceptTag: string) => {
    setGeneratingStatic(prev => new Set(prev).add(variantId));

    try {
      const response = await fetch('/api/render/static', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId }),
      });

      const data = await response.json();

      if (data.success && data.imageUrls) {
        const updatedVariants = variants.map(v =>
          v.id === variantId ? { ...v, staticImages: data.imageUrls } : v
        );
        setVariants(updatedVariants);
      }
    } catch (error) {
      console.error('Error generating static images:', error);
      alert('Failed to generate static images');
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
    </div>
  );
}
