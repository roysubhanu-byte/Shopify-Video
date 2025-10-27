import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react';

interface Asset {
  id: string;
  url: string;
  type: 'product' | 'lifestyle' | 'detail';
  qualityScore: number;
  width: number;
  height: number;
}

interface AssetSelectionModalProps {
  isOpen: boolean;
  assets: Asset[];
  selectedAssets: Asset[];
  onClose: () => void;
  onConfirm: (selected: Asset[]) => void;
  minSelection?: number;
  maxSelection?: number;
}

const typeColors = {
  product: 'bg-blue-100 text-blue-800 border-blue-300',
  lifestyle: 'bg-green-100 text-green-800 border-green-300',
  detail: 'bg-purple-100 text-purple-800 border-purple-300',
};

const typeLabels = {
  product: 'Product',
  lifestyle: 'Lifestyle',
  detail: 'Detail',
};

export default function AssetSelectionModal({
  isOpen,
  assets,
  selectedAssets,
  onClose,
  onConfirm,
  minSelection = 3,
  maxSelection = 5,
}: AssetSelectionModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(selectedAssets.map((a) => a.id)));
    }
  }, [isOpen, selectedAssets]);

  const toggleSelection = (assetId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      if (newSelected.size < maxSelection) {
        newSelected.add(assetId);
      }
    }
    setSelected(newSelected);
  };

  const autoSelectBest = () => {
    const sorted = [...assets].sort((a, b) => {
      if (b.qualityScore !== a.qualityScore) {
        return b.qualityScore - a.qualityScore;
      }
      const typeOrder = { product: 0, lifestyle: 1, detail: 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    const newSelected = new Set(sorted.slice(0, 4).map((a) => a.id));
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    const selectedAssetsList = assets.filter((a) => selected.has(a.id));
    onConfirm(selectedAssetsList);
  };

  const getQualityColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    return 'Low';
  };

  const isValidSelection = selected.size >= minSelection && selected.size <= maxSelection;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Product Images</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose {minSelection}-{maxSelection} images for your video beats
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                {selected.size} of {maxSelection} selected
              </span>
              {!isValidSelection && (
                <span className="text-xs text-red-600">
                  (Select at least {minSelection})
                </span>
              )}
            </div>
            <button
              onClick={autoSelectBest}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Auto-Select Best
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => {
              const isSelected = selected.has(asset.id);
              const isLowQuality = asset.qualityScore < 70;

              return (
                <div
                  key={asset.id}
                  onClick={() => toggleSelection(asset.id)}
                  className={`relative cursor-pointer group rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-[3/4] relative">
                    <img
                      src={asset.url}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {isLowQuality && (
                      <div className="absolute top-2 left-2 p-1 bg-yellow-500 rounded">
                        <AlertCircle className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                      <div className="flex items-center justify-between text-white text-xs">
                        <span
                          className={`px-2 py-1 rounded border ${
                            typeColors[asset.type]
                          }`}
                        >
                          {typeLabels[asset.type]}
                        </span>
                        <span className={`font-semibold ${getQualityColor(asset.qualityScore)}`}>
                          {asset.qualityScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-gray-50 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>{asset.width} × {asset.height}</span>
                      <span className={getQualityColor(asset.qualityScore)}>
                        {getQualityLabel(asset.qualityScore)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {assets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ImageIcon className="w-16 h-16 mb-4" />
              <p className="text-lg font-semibold">No images available</p>
              <p className="text-sm">Images will appear here after product ingestion</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p className="font-semibold mb-1">Selection Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Choose images with quality score above 70</li>
                <li>Mix product shots, lifestyle, and detail images</li>
                <li>Select 4 images for optimal storytelling (one per beat)</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValidSelection}
                className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  isValidSelection
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
