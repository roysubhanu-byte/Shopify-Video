import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Play } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { useState } from 'react';

export function LandingPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      navigate('/signin', { state: { productUrl: url } });
    } else {
      navigate('/signin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <TopNav variant="landing" />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-sm text-green-400 mb-6">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                URL → 3 Reels
              </div>

              <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Paste a link. Get Reels.{' '}
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  Sell more.
                </span>
              </h1>

              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                No filming. No editing. No surprises.<br />
                Your logo, your colors, your story—ready for TikTok, Reels, Shorts.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <div className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full text-sm text-slate-300">
                  No preview fees
                </div>
                <div className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full text-sm text-slate-300">
                  Works with Shopify & WooCommerce
                </div>
                <div className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full text-sm text-slate-300">
                  9:16 export
                </div>
                <div className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full text-sm text-slate-300">
                  Policy-safe presets
                </div>
              </div>

              <form onSubmit={handleGetStarted} className="space-y-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste your product URL here..."
                  className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center gap-2"
                  >
                    Get 3 videos free
                    <ArrowRight size={20} />
                  </button>

                  <Link
                    to="/examples"
                    className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all border border-slate-700 flex items-center gap-2"
                  >
                    See examples
                  </Link>
                </div>
              </form>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl rounded-full" />
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div
                      key={i}
                      className={`aspect-[9/16] bg-gradient-to-br rounded-lg flex items-center justify-center ${
                        i === 5
                          ? 'from-blue-500/30 to-cyan-500/30 col-span-1 row-span-1 scale-110 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20'
                          : 'from-slate-700/30 to-slate-800/30'
                      }`}
                    >
                      <Play size={i === 5 ? 32 : 20} className="text-white/60" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            From one product to every channel.
          </h2>
          <p className="text-xl text-slate-400">
            Paste your product link. We make platform-ready videos—fast.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="relative bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/50 rounded-3xl p-16 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-12">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-3 border border-slate-700">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </div>
                <span className="text-slate-400 font-medium">TikTok</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
                  <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                    <path d="M9 3v18" strokeWidth="2"/>
                  </svg>
                </div>
                <span className="text-white font-semibold">Your Product</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-3 border border-slate-700">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" fill="#E1306C"/>
                    <circle cx="12" cy="12" r="6" fill="white"/>
                    <circle cx="12" cy="12" r="3" fill="#E1306C"/>
                  </svg>
                </div>
                <span className="text-slate-400 font-medium">Instagram Reels</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-3 border border-slate-700">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" fill="#FF0000"/>
                    <path d="M10 8l6 4-6 4V8z" fill="white"/>
                  </svg>
                </div>
                <span className="text-slate-400 font-medium">YouTube Shorts</span>
              </div>
            </div>

            <p className="text-center text-slate-500 mt-12">
              Clean, human-friendly visuals. No avatars in v1.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-12 text-center">
            Turn a product page into three scroll-stoppers.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  We pull your title, price, features (and star rating if available).
                </h3>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  We write the hook and the script—customized with storytelling.
                </h3>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  We add captions and royalty-free music.
                </h3>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  You press "Download."
                </h3>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Link
              to="/signin"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              Make my first 3 videos
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-12 text-center">
            Everything you need. Nothing you don't.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              '3 vertical videos (10–20s) — Hook → Proof → CTA',
              'Auto-captions for sound-off viewing (EN / HI / BN)',
              'Your logo & brand colors—every time',
              'Royalty-free music you can swap in one click',
              'MP4s sized for TikTok, Reels, Shorts',
              'A/B-ready (Pro): 3 hooks × 3 CTAs',
              'Policy-safe presets: safe-zones, caps, disclosure',
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:border-blue-500/30 transition-colors"
              >
                <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                <p className="text-slate-200">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
