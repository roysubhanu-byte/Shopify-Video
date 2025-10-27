import { useState, useEffect } from 'react';
import { Sparkles, Check } from 'lucide-react';

interface Template {
  id: string;
  template_name: string;
  brand_inspiration: string;
  category: string;
  mood_keywords: string[];
  engagement_score: number;
  best_for_products: string[];
}

interface TemplateSelectorProps {
  productName: string;
  productCategory?: string;
  onSelect: (templateId: string) => void;
  selectedTemplateId?: string;
}

export default function TemplateSelector({
  productName,
  productCategory,
  onSelect,
  selectedTemplateId,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplateRecommendations();
  }, [productName, productCategory]);

  const fetchTemplateRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/templates/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          productCategory,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch template recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      athletic: 'bg-orange-100 text-orange-800 border-orange-300',
      tech: 'bg-blue-100 text-blue-800 border-blue-300',
      luxury: 'bg-purple-100 text-purple-800 border-purple-300',
      food_beverage: 'bg-red-100 text-red-800 border-red-300',
      fashion_lifestyle: 'bg-pink-100 text-pink-800 border-pink-300',
      beauty_wellness: 'bg-green-100 text-green-800 border-green-300',
      automotive: 'bg-gray-100 text-gray-800 border-gray-300',
      minimal_clean: 'bg-slate-100 text-slate-800 border-slate-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-gray-600">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Recommended Ad Styles
        </h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        AI-selected styles based on {productName}. These templates capture the visual language of top brands.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={`relative p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="mb-3">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {template.template_name}
                </h4>
                <p className="text-xs text-gray-500">
                  Inspired by {template.brand_inspiration}
                </p>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(
                    template.category
                  )}`}
                >
                  {template.category.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-600 font-semibold">
                  {template.engagement_score}% engagement
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {template.mood_keywords.slice(0, 3).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No template recommendations available</p>
          <p className="text-sm mt-2">Using default styling</p>
        </div>
      )}
    </div>
  );
}
