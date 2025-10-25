import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Play, Star, ChevronDown, Sparkles, Video as VideoIcon } from 'lucide-react';
import { TopNav } from '../components/TopNav';
import { useState } from 'react';

export function LandingPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      navigate('/signin', { state: { productUrl: url } });
    } else {
      navigate('/signin');
    }
  };

  const testimonials = [
    {
      stars: 5,
      text: "Topview.ai magically turns product links into perfect marketing videos, saving time and boosting sales.",
      author: "Sophia Martinez",
      role: "Marketing Director",
      company: "Medium-sized Business",
    },
    {
      stars: 4,
      text: "Topview's AI crafts perfect marketing content from our local videos, greatly enhancing our efforts.",
      author: "Mason Clark",
      role: "Marketing Specialist",
      company: "Small Business",
    },
    {
      stars: 5,
      text: "Topview's digital humans are incredibly lifelike. They add a personal and professional touch to our product videos.",
      author: "Elijah Walker",
      role: "Brand Manager",
      company: "Large Corporation",
    },
    {
      stars: 5,
      text: "Affordable and efficient. Topview's AI video creation is a fraction of the cost of hiring a human editor.",
      author: "Mia Robinson",
      role: "Small Retailer",
      company: "Small Business",
    },
    {
      stars: 5,
      text: "Topview manages script to final cut, making video production seamless and fast.",
      author: "Noah Davis",
      role: "Social Media Manager",
      company: "Medium-sized Enterprise",
    },
  ];

  const faqs = [
    {
      q: "How does HOBA generate videos from a product URL?",
      a: "Simply paste your Shopify or WooCommerce product URL. Our AI automatically extracts the title, features, images, and reviews, then generates 3 unique video concepts with trending hooks and professional voiceovers."
    },
    {
      q: "Do I need any video editing experience?",
      a: "No! HOBA is designed for everyone. Just paste a link, review the 3 generated concepts, and download your videos. No filming, no editing, no complicated software."
    },
    {
      q: "What's included in each video?",
      a: "Each video includes: trending hooks tailored to your product, professional AI voiceover, auto-generated captions in multiple languages, your brand colors and logo, royalty-free background music, and optimized 9:16 vertical format for TikTok, Reels, and Shorts."
    },
    {
      q: "How long does it take to generate videos?",
      a: "Preview videos (8-10 seconds) are generated in 2-3 minutes. Final HD videos (20-24 seconds) take about 5-7 minutes. You can generate unlimited free previews to test different concepts."
    },
    {
      q: "What makes HOBA different from other video tools?",
      a: "HOBA uses trend-aware AI to create 3 distinct video concepts automatically. Each concept uses proven storytelling frameworks (POV, Question, Before-After) with deterministic seeds, so you can iterate on hooks without re-rendering entire videos."
    },
    {
      q: "What platforms are the videos optimized for?",
      a: "All videos are created in 9:16 vertical format, perfect for TikTok, Instagram Reels, YouTube Shorts, and Facebook Reels. They include captions for sound-off viewing and meet platform advertising guidelines."
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <TopNav variant="landing" />

      <section className="pt-24 lg:pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-sm text-green-400 mb-6">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                URL → 3 Reels
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Paste a link. Get Reels.{' '}
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  Sell more.
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-slate-300 mb-8 leading-relaxed">
                No filming. No editing. No surprises.<br />
                Your logo, your colors, your story—ready for TikTok, Reels, Shorts.
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                <div className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full text-xs lg:text-sm text-slate-300">
                  No preview fees
                </div>
                <div className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full text-xs lg:text-sm text-slate-300">
                  Works with Shopify & WooCommerce
                </div>
                <div className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full text-xs lg:text-sm text-slate-300">
                  9:16 export
                </div>
                <div className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full text-xs lg:text-sm text-slate-300">
                  Policy-safe presets
                </div>
              </div>

              <form onSubmit={handleGetStarted} className="space-y-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste your product URL here..."
                  className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    className="px-6 lg:px-8 py-3 lg:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 text-sm lg:text-base"
                  >
                    Get 3 videos free
                    <ArrowRight size={18} />
                  </button>

                  <Link
                    to="/examples"
                    className="px-6 lg:px-8 py-3 lg:py-4 bg-slate-800/50 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all border border-slate-700 flex items-center justify-center gap-2 text-sm lg:text-base"
                  >
                    See examples
                  </Link>
                </div>
              </form>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl rounded-full" />
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div
                      key={i}
                      className={`aspect-[9/16] bg-gradient-to-br rounded-lg flex items-center justify-center transition-all ${
                        i === 5
                          ? 'from-blue-500/30 to-cyan-500/30 scale-105 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20'
                          : 'from-slate-700/30 to-slate-800/30 hover:scale-105'
                      }`}
                    >
                      <Play size={i === 5 ? 28 : 18} className="text-white/60" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              Real AI for video editing
            </h2>
            <p className="text-lg lg:text-xl text-slate-400">
              Our AI analyzes millions of successful videos to create perfect content
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 lg:p-10 backdrop-blur-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="relative">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Sparkles size={28} className="text-white" />
                      </div>
                      <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                        <span className="text-blue-300 font-semibold text-sm">AI Analysis</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full w-full" />
                      <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-4/5" />
                      <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-3/5" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">AI script</h3>
                  <p className="text-slate-300 text-base lg:text-lg leading-relaxed">
                    Using GPT-4o, our tool learns from 5 million videos to write perfect scripts. Every hook is trend-aware and optimized for your target audience.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 lg:p-10 backdrop-blur-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                    AI-powered clip selection and editing
                  </h3>
                  <p className="text-slate-300 text-base lg:text-lg leading-relaxed">
                    AI automatically understands, selects, and edits your video clips. No manual editing required—just perfect results every time.
                  </p>
                </div>

                <div className="relative order-1 lg:order-2">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                              {i === 2 ? (
                                <Check size={16} className="text-blue-400" />
                              ) : (
                                <VideoIcon size={16} className="text-slate-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 lg:p-10 backdrop-blur-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="relative">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                    <div className="space-y-4">
                      {['Olivia', 'Emily', 'Nicholas', 'Henry'].map((name, i) => (
                        <div key={name} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {name[0]}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium text-sm">{name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${70 + i * 10}%` }} />
                              </div>
                              <Play size={14} className="text-blue-400" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">AI voiceover</h3>
                  <p className="text-slate-300 text-base lg:text-lg leading-relaxed">
                    OpenAI and ElevenLabs provide lifelike AI voices for professional, engaging video content. Choose from diverse voices that match your brand.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              Authentic User Reviews of the Product
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((review, index) => (
              <div
                key={index}
                className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-blue-500/30 transition-colors"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < review.stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}
                    />
                  ))}
                </div>

                <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                  "{review.text}"
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {review.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{review.author}</div>
                    <div className="text-slate-400 text-xs">{review.role}</div>
                    <div className="text-slate-500 text-xs">{review.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-6 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-400">
              Everything you need to know about HOBA
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-slate-800/30 border border-slate-700/50 rounded-xl backdrop-blur-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-white font-semibold text-base lg:text-lg pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-slate-400 flex-shrink-0 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openFaq === index && (
                  <div className="px-6 pb-5">
                    <p className="text-slate-300 leading-relaxed text-sm lg:text-base">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to create your first videos?
          </h2>
          <p className="text-lg lg:text-xl text-slate-400 mb-8">
            Join thousands of brands creating scroll-stopping content with HOBA
          </p>

          <Link
            to="/signin"
            className="inline-flex px-8 lg:px-10 py-4 lg:py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-105 text-base lg:text-lg"
          >
            Get 3 videos free
            <ArrowRight size={22} className="ml-2" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          <p>&copy; 2025 HOBA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
