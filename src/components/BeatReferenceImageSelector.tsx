import { useState, useRef } from 'react';
import { Upload, X, RotateCcw, Check, Loader2 } from 'lucide-react';
import { uploadReferenceImage, deleteReferenceImage } from '../lib/api';

interface BeatImage {
  beatNumber: number;
  imageUrl: string;
  isCustom: boolean;
  thumbnailUrl?: string;
}

interface Props {
  variantId: string;
  autoSelectedImages: string[];
  customImages: Map<number, { id: string; url: string; thumbnailUrl?: string }>;
  onImageUploaded: (beatNumber: number, imageData: { id: string; url: string; thumbnailUrl?: string }) => void;
  onImageRemoved: (beatNumber: number) => void;
}

const BEAT_LABELS = ['Hook', 'Demo 1', 'Demo 2', 'CTA'];

export function BeatReferenceImageSelector({
  variantId,
  autoSelectedImages,
  customImages,
  onImageUploaded,
  onImageRemoved,
}: Props) {
  const [uploadingBeat, setUploadingBeat] = useState<number | null>(null);
  const [removingBeat, setRemovingBeat] = useState<number | null>(null);
  const [errors, setErrors] = useState<Map<number, string>>(new Map());
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const getBeatImages = (): BeatImage[] => {
    return [1, 2, 3, 4].map((beatNumber) => {
      const custom = customImages.get(beatNumber);
      if (custom) {
        return {
          beatNumber,
          imageUrl: custom.url,
          isCustom: true,
          thumbnailUrl: custom.thumbnailUrl,
        };
      }

      const autoIndex = beatNumber - 1;
      return {
        beatNumber,
        imageUrl: autoSelectedImages[autoIndex] || autoSelectedImages[0],
        isCustom: false,
      };
    });
  };

  const handleFileSelect = async (beatNumber: number, file: File | null) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrors(new Map(errors.set(beatNumber, 'Image must be less than 10MB')));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors(new Map(errors.set(beatNumber, 'File must be an image')));
      return;
    }

    setUploadingBeat(beatNumber);
    setErrors(new Map(errors.set(beatNumber, '')));

    try {
      const result = await uploadReferenceImage(variantId, beatNumber, file);

      onImageUploaded(beatNumber, {
        id: result.override.id,
        url: result.override.publicUrl,
        thumbnailUrl: result.override.thumbnailUrl,
      });

      setErrors(new Map(errors.set(beatNumber, '')));
    } catch (error) {
      setErrors(
        new Map(
          errors.set(
            beatNumber,
            error instanceof Error ? error.message : 'Failed to upload image'
          )
        )
      );
    } finally {
      setUploadingBeat(null);
    }
  };

  const handleRemoveCustomImage = async (beatNumber: number) => {
    setRemovingBeat(beatNumber);

    try {
      await deleteReferenceImage(variantId, beatNumber);
      onImageRemoved(beatNumber);
      setErrors(new Map(errors.set(beatNumber, '')));
    } catch (error) {
      setErrors(
        new Map(
          errors.set(
            beatNumber,
            error instanceof Error ? error.message : 'Failed to remove image'
          )
        )
      );
    } finally {
      setRemovingBeat(null);
    }
  };

  const beatImages = getBeatImages();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Reference Images for Each Beat
        </h3>
        <p className="text-sm text-slate-400">
          System auto-selects the best images, but you can upload custom ones for any beat
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {beatImages.map((beat) => {
          const error = errors.get(beat.beatNumber);
          const isUploading = uploadingBeat === beat.beatNumber;
          const isRemoving = removingBeat === beat.beatNumber;

          return (
            <div
              key={beat.beatNumber}
              className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="relative aspect-[9/16] bg-slate-900">
                <img
                  src={beat.thumbnailUrl || beat.imageUrl}
                  alt={`Beat ${beat.beatNumber}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {beat.isCustom && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-md">
                      <Check size={12} />
                      Custom
                    </span>
                  </div>
                )}

                {!beat.isCustom && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-300 text-xs font-medium rounded-md">
                      Auto-Selected
                    </span>
                  </div>
                )}

                {(isUploading || isRemoving) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    Beat {beat.beatNumber}: {BEAT_LABELS[beat.beatNumber - 1]}
                  </span>
                </div>

                {error && (
                  <p className="text-xs text-red-400">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRefs.current[beat.beatNumber - 1]?.click()}
                    disabled={isUploading || isRemoving}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload size={14} />
                    {beat.isCustom ? 'Replace' : 'Upload'}
                  </button>

                  {beat.isCustom && (
                    <button
                      onClick={() => handleRemoveCustomImage(beat.beatNumber)}
                      disabled={isUploading || isRemoving}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
                      title="Reset to auto-selected"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>

                <input
                  ref={(el) => (fileInputRefs.current[beat.beatNumber - 1] = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(beat.beatNumber, e.target.files?.[0] || null)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-white mb-2">Tips for Best Results</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Use high-resolution images (1080x1920 or higher)</li>
          <li>• Ensure product is clearly visible and well-lit</li>
          <li>• Avoid busy backgrounds that might distract</li>
          <li>• Images will be auto-cropped to 9:16 aspect ratio</li>
          <li>• Upload limit: 10MB per image</li>
        </ul>
      </div>
    </div>
  );
}
