import { Play } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';

export function ExamplesPage() {
  const { isAuthenticated } = useStore();

  const examples = [
    {
      id: 1,
      type: 'Reference',
      product: 'Wellness Boost Multi-Vitamin',
      thumbnail: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg',
    },
    {
      id: 2,
      type: 'AI-Recreated',
      product: 'Golden Honey Jar',
      thumbnail: 'https://images.pexels.com/photos/5662857/pexels-photo-5662857.jpeg',
    },
    {
      id: 3,
      type: 'Reference',
      product: 'Premium Backpack',
      thumbnail: 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg',
    },
    {
      id: 4,
      type: 'AI-Recreated',
      product: 'Black Travel Backpack',
      thumbnail: 'https://images.pexels.com/photos/2422476/pexels-photo-2422476.jpeg',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <TopNav variant={isAuthenticated ? 'default' : 'landing'} />

      <div className="max-w-7xl mx-auto px-6 py-20 pt-32">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Get Inspired by Real Brands
          </h1>
          <Link
            to="/signin"
            className="inline-flex px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Create now →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {examples.map((example) => (
            <div
              key={example.id}
              className="group relative aspect-[9/16] bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
            >
              <img
                src={example.thumbnail}
                alt={example.product}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-full text-xs text-white flex items-center gap-1.5">
                  <Play size={12} />
                  {example.type}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-medium text-sm">{example.product}</p>
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play size={28} className="text-white" fill="white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to create yours?
          </h2>
          <Link
            to="/signin"
            className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105"
          >
            Get 3 videos free
          </Link>
        </div>
      </div>
    </div>
  );
}
