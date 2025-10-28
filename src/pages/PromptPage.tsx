import { useState, useEffect } from 'react';
import { Sparkles, Play, Wand2, Upload, X, Plus, Loader2 } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { VideoPlayer } from '../components/VideoPlayer';
import { useUserCredits } from '../hooks/useUserCredits';
import {
  plan as promptPlan,
  renderPreviews as promptRenderPreview,
  renderFinals as promptRenderFinal,
  getJobStatus as getPromptJobStatus,
} from '../lib/api';

import { i18n } from '../lib/i18n';
import type { ScriptBeat, Overlay, PromptPlanResponse } from '../types/api';

interface ValidationError {
  field: string;
  message: string;
}

export function PromptPage() {
  useUserCredits();

  const [aspect, setAspect] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [duration, setDuration] = useState(20);
  const [tone, setTone] = useState<'casual' | 'professional' | 'energetic' | 'calm'>('professional');
  const [freeText, setFreeText] = useState('');
  const [hookTemplate, setHookTemplate] = useState('');
  const [scriptBeats, setScriptBeats] = useState<ScriptBeat[]>([]);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [voiceId, setVoiceId] = useState('default');
  const [seed, setSeed] = useState(Math.floor(Math.random() * 10000));
  const [assetUrls, setAssetUrls] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [newAssetUrl, setNewAssetUrl] = useState('');

  const [promptId, setPromptId] = useState<string | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const [isPlanning, setIsPlanning] = useState(false);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);
  const [isRenderingFinal, setIsRenderingFinal] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validateForm = (): boolean => {
    const newErrors: ValidationError[] = [];

    overlays.forEach((overlay, idx) => {
      const wordCount = overlay.text.trim().split(/\s+/).length;
      if (wordCount > 6) {
        newErrors.push({
          field: `overlay-${idx}`,
          message: `Overlay too long (max 6 words). Current: ${wordCount} words.`,
        });
      }
    });

    const totalScriptDuration = scriptBeats.reduce((sum, beat) => sum + beat.duration, 0);
    if (totalScriptDuration > duration + 2) {
      newErrors.push({
        field: 'script',
        message: `Script too long for ${duration}s; shorten VO or pick ${duration + 4}s.`,
      });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleGeneratePlan = async () => {
    if (!freeText.trim()) {
      setErrors([{ field: 'freeText', message: 'Please enter a description for your video' }]);
      return;
    }

    setIsPlanning(true);
    setErrors([]);

    try {
      const response = await promptPlan({
        freeText,
        aspect,
        duration,
        tone,
      });

      setPromptId(response.promptId);
      setHookTemplate(response.hook);
      setScriptBeats(response.scriptBeats);
      setOverlays(response.overlays);
      setVoiceId(response.voiceId);
    } catch (error) {
      setErrors([{
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to generate plan',
      }]);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleRenderPreview = async () => {
    if (!promptId || !validateForm()) return;

    setIsRenderingPreview(true);
    setErrors([]);

    try {
      const idempotencyKey = `preview-${promptId}-${Date.now()}`;
      const response = await promptRenderPreview({
        promptId,
        mode: 'preview',
        idempotencyKey,
      });

      setCurrentRunId(response.runId);
    } catch (error) {
      setErrors([{
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to start preview render',
      }]);
      setIsRenderingPreview(false);
    }
  };

  const handleRenderFinal = async () => {
    if (!promptId || !validateForm()) return;

    setIsRenderingFinal(true);
    setErrors([]);

    try {
      const idempotencyKey = `final-${promptId}-${Date.now()}`;
      const response = await promptRenderFinal({
        promptId,
        mode: 'final',
        idempotencyKey,
      });

      setCurrentRunId(response.runId);
    } catch (error) {
      setErrors([{
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to start final render',
      }]);
      setIsRenderingFinal(false);
    }
  };

  useEffect(() => {
    if (!currentRunId || (!isRenderingPreview && !isRenderingFinal)) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await getPromptJobStatus(currentRunId);

        if (status.status === 'succeeded') {
          setVideoUrl(status.videoUrl || null);
          setIsRenderingPreview(false);
          setIsRenderingFinal(false);
          setCurrentRunId(null);
          clearInterval(pollInterval);
        } else if (status.status === 'failed') {
          setErrors([{
            field: 'general',
            message: status.error || 'Render failed',
          }]);
          setIsRenderingPreview(false);
          setIsRenderingFinal(false);
          setCurrentRunId(null);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [currentRunId, isRenderingPreview, isRenderingFinal]);

  const addScriptBeat = () => {
    setScriptBeats([...scriptBeats, { text: '', duration: 3 }]);
  };

  const removeScriptBeat = (index: number) => {
    setScriptBeats(scriptBeats.filter((_, i) => i !== index));
  };

  const updateScriptBeat = (index: number, field: 'text' | 'duration', value: string | number) => {
    const updated = [...scriptBeats];
    updated[index] = { ...updated[index], [field]: value };
    setScriptBeats(updated);
  };

  const addOverlay = () => {
    setOverlays([...overlays, { text: '', timestamp: 0 }]);
  };

  const removeOverlay = (index: number) => {
    setOverlays(overlays.filter((_, i) => i !== index));
  };

  const updateOverlay = (index: number, field: 'text' | 'timestamp', value: string | number) => {
    const updated = [...overlays];
    updated[index] = { ...updated[index], [field]: value };
    setOverlays(updated);
  };

  const addAsset = () => {
    if (newAssetUrl.trim() && assetUrls.length < 10) {
      setAssetUrls([...assetUrls, newAssetUrl.trim()]);
      setNewAssetUrl('');
    }
  };

  const removeAsset = (index: number) => {
    setAssetUrls(assetUrls.filter((_, i) => i !== index));
  };

  const getErrorMessage = (field: string): string | null => {
    const error = errors.find(e => e.field === field);
    return error ? error.message : null;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Wand2 size={22} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Prompt Mode</h1>
          </div>
          <p className="text-slate-400">
            Create custom videos with full control over every aspect
          </p>
        </div>

        {errors.find(e => e.field === 'general') && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-300">{getErrorMessage('general')}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-blue-400" />
              AI-Assisted Planning
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Describe your video
                </label>
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="E.g., 'Create a video showcasing wireless headphones with noise cancellation, emphasizing comfort for all-day wear'"
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {getErrorMessage('freeText') && (
                  <p className="text-xs text-red-400 mt-1">{getErrorMessage('freeText')}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspect}
                    onChange={(e) => setAspect(e.target.value as '9:16' | '1:1' | '16:9')}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="9:16">9:16 (TikTok)</option>
                    <option value="1:1">1:1 (Instagram)</option>
                    <option value="16:9">16:9 (YouTube)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={30}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="energetic">Energetic</option>
                    <option value="calm">Calm</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={isPlanning}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                {isPlanning ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Plan
                  </>
                )}
              </button>
            </div>
          </div>

          {promptId && (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Hook Template</h2>
                <input
                  type="text"
                  value={hookTemplate}
                  onChange={(e) => setHookTemplate(e.target.value)}
                  placeholder="E.g., POV: You finally found headphones that don't hurt"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Script Beats</h2>
                  <button
                    onClick={addScriptBeat}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Plus size={16} />
                    Add Beat
                  </button>
                </div>

                {getErrorMessage('script') && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-400">{getErrorMessage('script')}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {scriptBeats.map((beat, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={beat.text}
                          onChange={(e) => updateScriptBeat(idx, 'text', e.target.value)}
                          placeholder="Script text"
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={beat.duration}
                        onChange={(e) => updateScriptBeat(idx, 'duration', parseInt(e.target.value))}
                        className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeScriptBeat(idx)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Text Overlays</h2>
                  <button
                    onClick={addOverlay}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Plus size={16} />
                    Add Overlay
                  </button>
                </div>

                <div className="space-y-3">
                  {overlays.map((overlay, idx) => (
                    <div key={idx}>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={overlay.text}
                            onChange={(e) => updateOverlay(idx, 'text', e.target.value)}
                            placeholder="Overlay text (max 6 words)"
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={duration}
                          value={overlay.timestamp}
                          onChange={(e) => updateOverlay(idx, 'timestamp', parseInt(e.target.value))}
                          placeholder="Time"
                          className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeOverlay(idx)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      {getErrorMessage(`overlay-${idx}`) && (
                        <p className="text-xs text-red-400 mt-1">{getErrorMessage(`overlay-${idx}`)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Assets</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Images ({assetUrls.length}/10)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={newAssetUrl}
                        onChange={(e) => setNewAssetUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={addAsset}
                        disabled={assetUrls.length >= 10}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        <Upload size={18} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {assetUrls.map((url, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg">
                          <span className="text-sm text-slate-300 truncate flex-1">{url}</span>
                          <button
                            onClick={() => removeAsset(idx)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Logo URL (optional)
                    </label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleRenderPreview}
                  disabled={isRenderingPreview || isRenderingFinal}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isRenderingPreview ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {i18n.messages.rendering}
                    </>
                  ) : (
                    <>
                      <Play size={20} />
                      {i18n.cta.preview} (8-10s) - 1 credit
                    </>
                  )}
                </button>

                <button
                  onClick={handleRenderFinal}
                  disabled={isRenderingPreview || isRenderingFinal}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isRenderingFinal ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {i18n.messages.rendering}
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      {i18n.cta.finalize} (20-24s) - 3 credits
                    </>
                  )}
                </button>
              </div>

              {videoUrl && (
                <div className="bg-slate-900 border border-green-500/20 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Your Video is Ready!</h2>
                  <button
                    onClick={() => setSelectedVideo(videoUrl)}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={20} />
                    Watch Video
                  </button>
                </div>
              )}
            </>
          )}
        </div>
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
