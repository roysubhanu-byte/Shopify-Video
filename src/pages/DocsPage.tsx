import { CheckCircle2, Video, Sparkles, Zap } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { useStore } from '../store/useStore';

export function DocsPage() {
  const { isAuthenticated } = useStore();

  return (
    <div className="min-h-screen bg-slate-950">
      <TopNav variant={isAuthenticated ? 'default' : 'landing'} />
      <div className="max-w-4xl mx-auto px-6 py-20 pt-32">
        <h1 className="text-4xl font-bold text-white mb-4">
          How It Works
        </h1>
        <p className="text-xl text-slate-400 mb-12">
          From product URL to platform-ready videos in minutes
        </p>

        <div className="space-y-12">
          <section className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <Video className="text-cyan-500" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">1. Paste Your Product URL</h2>
            </div>
            <p className="text-slate-300 mb-4">
              Simply paste any Shopify or WooCommerce product page URL. Our engine automatically extracts:
            </p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                Product title, price, and features
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                Product images and colors
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                Customer reviews and ratings
              </li>
            </ul>
          </section>

          <section className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Sparkles className="text-orange-500" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">2. AI Generates 3 Concepts</h2>
            </div>
            <p className="text-slate-300 mb-4">
              Our trend-aware AI creates three distinct video concepts using proven storytelling frameworks:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-4">
                <h3 className="font-bold text-cyan-400 mb-2">Concept A: POV</h3>
                <p className="text-sm text-slate-400">Point-of-view storytelling that puts viewers in the experience</p>
              </div>
              <div className="bg-slate-900 border border-orange-500/30 rounded-lg p-4">
                <h3 className="font-bold text-orange-400 mb-2">Concept B: Question</h3>
                <p className="text-sm text-slate-400">Hooks with compelling questions that demand answers</p>
              </div>
              <div className="bg-slate-900 border border-green-500/30 rounded-lg p-4">
                <h3 className="font-bold text-green-400 mb-2">Concept C: Before-After</h3>
                <p className="text-sm text-slate-400">Shows transformation and problem-solving</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm">
              Each concept includes a unique hook, deterministic seed for reproducibility, and 4-beat story structure.
            </p>
          </section>

          <section className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Zap className="text-blue-500" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">3. Preview & Generate Finals</h2>
            </div>
            <p className="text-slate-300 mb-4">
              Review free 8-10 second previews of all three concepts, then generate final videos:
            </p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                20-24 second vertical videos (9:16 ratio)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                Professional voice-over with auto-captions
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                Your brand colors and logo automatically applied
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                Ready for TikTok, Instagram Reels, and YouTube Shorts
              </li>
            </ul>
          </section>

          <section className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300">
              <div>
                <h3 className="font-bold text-white mb-2">Trend-Aware Hooks</h3>
                <p className="text-sm">Our AI analyzes current trends to create hooks that resonate with your target audience</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">Deterministic Seeds</h3>
                <p className="text-sm">Iterate on hooks without re-rendering the entire video. Save time and credits</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">Zero-Asset Brand Kit</h3>
                <p className="text-sm">Automatic SVG wordmark, color palette extraction, and branded overlays</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">Policy-Safe</h3>
                <p className="text-sm">Pre-configured presets ensure your videos meet platform advertising guidelines</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
