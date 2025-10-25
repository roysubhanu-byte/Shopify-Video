import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { UrlForm } from '../components/UrlForm';
import { ConceptTile } from '../components/ConceptTile';
import { VideoPlayer } from '../components/VideoPlayer';
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

  const handleUrlSubmit = async (url: string, vertical: string) => {
    setIsIngesting(true);
    setIsPlanning(true);

    try {
      const ingestData = await ingest(url);
      setProjectData(ingestData);

      const planData = await plan(ingestData.projectId);
      setVariants(planData.variants);
    } catch (error) {
      console.error('Error:', error);
      alert(i18n.messages.error);
    } finally {
      setIsIngesting(false);
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

  const hasValidRenders = variants.some(v => {
    const render = renders.get(v.id);
    return render?.status === 'succeeded' && render?.videoUrl;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <TopNav />
      <div className="max-w-7xl mx-auto px-6 py-12">
        {variants.length === 0 ? (
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
              isLoading={isIngesting || isPlanning}
              productData={productData}
            />
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Your 3 Video Concepts
              </h2>
              <p className="text-slate-400">
                Each concept uses a different hook and storytelling approach
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {variants.map((variant) => (
                <ConceptTile
                  key={variant.id}
                  variant={variant}
                  render={renders.get(variant.id)}
                  onPlay={() => {
                    const render = renders.get(variant.id);
                    if (render?.videoUrl) {
                      setSelectedVideo(render.videoUrl);
                    }
                  }}
                />
              ))}
            </div>

            {!hasValidRenders && (
              <div className="flex justify-center">
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
              <div className="flex justify-center">
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

      {selectedVideo && (
        <VideoPlayer
          videoUrl={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}
