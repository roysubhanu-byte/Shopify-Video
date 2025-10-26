import { useState } from 'react';
import { Video, Image as ImageIcon, Download, Coins } from 'lucide-react';

interface ModeTabsProps {
  conceptsData: Array<{
    id: string;
    tag: string;
    type: string;
    hook?: string;
    videoUrl?: string;
    staticImages?: string[];
  }>;
  onGenerateStatic: (variantId: string, conceptTag: string) => void;
  generatingStatic?: Set<string>;
  creditsEnabled?: boolean;
}

export function ModeTabs({ conceptsData, onGenerateStatic, generatingStatic = new Set(), creditsEnabled = false }: ModeTabsProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'static'>('video');

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
            activeTab === 'video'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Video className="w-5 h-5" />
          Video Previews
        </button>
        <button
          onClick={() => setActiveTab('static')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
            activeTab === 'static'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ImageIcon className="w-5 h-5" />
          Static Images
        </button>
      </div>

      {activeTab === 'video' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {conceptsData.map((concept) => (
            <div key={concept.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-blue-600">{concept.tag}</span>
                  <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                    {concept.type}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {concept.hook || 'No hook generated yet'}
                </p>
              </div>

              <div className="p-4">
                {concept.videoUrl ? (
                  <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                    <video
                      src={concept.videoUrl}
                      controls
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="aspect-[9/16] bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No video yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'static' && (
        <div className="space-y-8">
          {creditsEnabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
              <Coins className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Uses 5 credits for 3 images</span> per concept
              </p>
            </div>
          )}

          {conceptsData.map((concept) => (
            <div key={concept.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Concept {concept.tag}
                    <span className="ml-3 text-sm text-gray-500 font-normal">
                      {concept.type}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {concept.hook || 'No hook generated yet'}
                  </p>
                </div>
                <button
                  onClick={() => onGenerateStatic(concept.id, concept.tag)}
                  disabled={generatingStatic.has(concept.id)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {generatingStatic.has(concept.id) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      Create 3 Images
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => {
                  const imageUrl = concept.staticImages?.[index];

                  return (
                    <div key={index} className="relative">
                      {imageUrl ? (
                        <>
                          <img
                            src={imageUrl}
                            alt={`${concept.tag} variant ${index + 1}`}
                            className="w-full aspect-[9/16] object-cover rounded-lg shadow-md"
                          />
                          <a
                            href={imageUrl}
                            download={`concept-${concept.tag}-${index + 1}.png`}
                            className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                          >
                            <Download className="w-4 h-4 text-gray-700" />
                          </a>
                          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            Variant {index + 1}
                          </div>
                        </>
                      ) : (
                        <div className="w-full aspect-[9/16] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                          <div className="text-center text-gray-400">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-xs">Placeholder {index + 1}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
