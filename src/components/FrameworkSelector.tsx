import { useState, useEffect } from 'react';
import { CheckCircle, Sparkles, TrendingUp } from 'lucide-react';

interface Framework {
  id: string;
  name: string;
  description: string;
  bestFor: string[];
  examplePrompt: string;
  emotionalArc: string;
  recommended?: boolean;
}

interface FrameworkSelectorProps {
  productData: any;
  selectedFramework?: string;
  onSelect: (frameworkId: string) => void;
}

export function FrameworkSelector({
  productData,
  selectedFramework,
  onSelect,
}: FrameworkSelectorProps) {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [category, setCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFrameworks = async () => {
      try {
        const response = await fetch('/api/frameworks/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productData }),
        });

        const data = await response.json();
        setFrameworks(data.frameworks || []);
        setCategory(data.category || '');
      } catch (error) {
        console.error('Error fetching frameworks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productData) {
      fetchFrameworks();
    }
  }, [productData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const recommended = frameworks.filter(fw => fw.recommended);
  const others = frameworks.filter(fw => !fw.recommended);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">
          Choose Your Story Framework
        </h3>
        <p className="text-slate-400">
          Select a proven storytelling structure for your video
        </p>
        {category && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-300">
            <Sparkles size={16} />
            Detected: {category}
          </div>
        )}
      </div>

      {recommended.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={20} className="text-green-400" />
            <h4 className="text-lg font-semibold text-white">
              Recommended for {category}
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map(framework => (
              <FrameworkCard
                key={framework.id}
                framework={framework}
                selected={selectedFramework === framework.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">
            Other Frameworks
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map(framework => (
              <FrameworkCard
                key={framework.id}
                framework={framework}
                selected={selectedFramework === framework.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FrameworkCardProps {
  framework: Framework;
  selected: boolean;
  onSelect: (frameworkId: string) => void;
}

function FrameworkCard({ framework, selected, onSelect }: FrameworkCardProps) {
  return (
    <button
      onClick={() => onSelect(framework.id)}
      className={`relative p-5 rounded-xl border-2 transition-all text-left ${
        selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3">
          <CheckCircle size={24} className="text-blue-500" />
        </div>
      )}

      {framework.recommended && !selected && (
        <div className="absolute top-3 right-3">
          <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
            RECOMMENDED
          </div>
        </div>
      )}

      <h5 className="text-lg font-bold text-white mb-2 pr-8">
        {framework.name}
      </h5>

      <p className="text-sm text-slate-400 mb-3">
        {framework.description}
      </p>

      <div className="text-xs text-slate-500 mb-3">
        <span className="font-semibold">Emotional Arc:</span> {framework.emotionalArc}
      </div>

      <div className="text-xs text-slate-600 italic">
        "{framework.examplePrompt}"
      </div>
    </button>
  );
}
