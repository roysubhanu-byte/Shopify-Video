import { Clock, GripVertical } from 'lucide-react';

interface BeatCardProps {
  beatNumber: 1 | 2 | 3 | 4;
  beatTitle: string;
  beatDescription: string;
  imageUrl?: string;
  duration: number;
  isDragging?: boolean;
  dragHandleProps?: any;
  ctaText?: string;
  onCtaTextChange?: (text: string) => void;
}

const CTA_OPTIONS = ['Learn More', 'Buy Now', 'Shop Now', 'Order Now', 'Get Yours', 'Limited Time'];

const beatColors = {
  1: 'border-blue-500 bg-blue-50',
  2: 'border-green-500 bg-green-50',
  3: 'border-purple-500 bg-purple-50',
  4: 'border-orange-500 bg-orange-50',
};

const beatLabels = {
  1: 'Hook',
  2: 'Demo 1',
  3: 'Demo 2',
  4: 'CTA',
};

export default function BeatCard({
  beatNumber,
  beatTitle,
  beatDescription,
  imageUrl,
  duration,
  isDragging = false,
  dragHandleProps,
  ctaText,
  onCtaTextChange,
}: BeatCardProps) {
  const isCTABeat = beatNumber === 4;

  return (
    <div
      className={`relative flex gap-4 p-4 border-2 rounded-lg transition-all ${
        beatColors[beatNumber]
      } ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}
    >
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="flex items-center cursor-move text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}

      <div className="flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Beat ${beatNumber}`}
            className="w-24 h-32 object-cover rounded border-2 border-white shadow-md"
          />
        ) : (
          <div className="w-24 h-32 bg-gray-200 rounded border-2 border-white shadow-md flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-white rounded text-xs font-semibold">
              Beat {beatNumber}
            </span>
            <span className="text-sm font-bold">{beatLabels[beatNumber]}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            <span>{duration}s</span>
          </div>
        </div>

        <h4 className="font-semibold text-gray-900 mb-1">{beatTitle}</h4>
        <p className="text-sm text-gray-600 line-clamp-2">{beatDescription}</p>

        {isCTABeat && onCtaTextChange && (
          <div className="mt-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Call-to-Action Text
            </label>
            <select
              value={ctaText || 'Shop Now'}
              onChange={(e) => onCtaTextChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {CTA_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
