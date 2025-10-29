import { useState } from 'react';
import { ArrowRight, Shuffle } from 'lucide-react';
import BeatCard from './BeatCard';

interface Asset {
  id: string;
  url: string;
  type: 'product' | 'lifestyle' | 'detail';
  qualityScore: number;
  width: number;
  height: number;
}

interface Beat {
  beatNumber: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  duration: number;
}

interface StoryboardPreviewProps {
  assets: Asset[];
  hook?: string;
  productName?: string;
  onReorder?: (newOrder: Asset[]) => void;
  onEditAssets?: () => void;
  ctaText?: string;
  onCtaTextChange?: (text: string) => void;
}

const defaultBeats: Beat[] = [
  {
    beatNumber: 1,
    title: 'Hook - Grab Attention',
    description: 'Open with the trending hook to stop the scroll',
    duration: 6,
  },
  {
    beatNumber: 2,
    title: 'Demo 1 - Feature Showcase',
    description: 'Show the product in action, highlight key feature',
    duration: 6,
  },
  {
    beatNumber: 3,
    title: 'Demo 2 - Lifestyle/Benefit',
    description: 'Demonstrate the benefit or lifestyle integration',
    duration: 6,
  },
  {
    beatNumber: 4,
    title: 'CTA - Call to Action',
    description: 'Hero shot with social proof and clear call-to-action',
    duration: 6,
  },
];

export default function StoryboardPreview({
  assets,
  hook,
  onReorder,
  onEditAssets,
  ctaText,
  onCtaTextChange,
}: StoryboardPreviewProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newAssets = [...assets];
    const draggedAsset = newAssets[draggedIndex];
    newAssets.splice(draggedIndex, 1);
    newAssets.splice(index, 0, draggedAsset);

    onReorder?.(newAssets);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const totalDuration = defaultBeats.reduce((sum, beat) => sum + beat.duration, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Video Storyboard</h3>
          <p className="text-sm text-gray-600 mt-1">
            {assets.length} images selected · {totalDuration} seconds total
          </p>
        </div>
        <button
          onClick={onEditAssets}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Shuffle className="w-4 h-4" />
          Change Images
        </button>
      </div>

      {hook && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-900 mb-1">Trending Hook:</p>
          <p className="text-lg text-blue-800">"{hook}"</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-semibold">Visual Flow:</span>
          <ArrowRight className="w-4 h-4" />
          <span>Drag cards to reorder</span>
        </div>

        <div className="space-y-3">
          {defaultBeats.map((beat, index) => {
            const asset = assets[index];
            return (
              <div
                key={beat.beatNumber}
                draggable={!!onReorder}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <BeatCard
                  beatNumber={beat.beatNumber}
                  beatTitle={beat.title}
                  beatDescription={beat.description}
                  imageUrl={asset?.url}
                  duration={beat.duration}
                  isDragging={draggedIndex === index}
                  dragHandleProps={onReorder ? {} : undefined}
                  ctaText={beat.beatNumber === 4 ? ctaText : undefined}
                  onCtaTextChange={beat.beatNumber === 4 ? onCtaTextChange : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-semibold text-gray-700">Video Format</p>
          <p className="text-sm text-gray-600">9:16 Vertical (TikTok, Reels, Shorts)</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Total Duration</p>
          <p className="text-sm text-gray-600">{totalDuration} seconds</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Beats</p>
          <p className="text-sm text-gray-600">4 beats × 6 seconds each</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Generation Cost</p>
          <p className="text-sm text-gray-600">${(totalDuration * 0.4).toFixed(2)} per video</p>
        </div>
      </div>

      {assets.length < 4 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> You have selected {assets.length} image{assets.length !== 1 ? 's' : ''}.
            We recommend selecting 4 images (one per beat) for the best results.
          </p>
        </div>
      )}
    </div>
  );
}
