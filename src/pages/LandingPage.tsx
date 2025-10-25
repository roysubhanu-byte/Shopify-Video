import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, ChevronDown, Play } from 'lucide-react';
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

  const exampleVideos = [
    { title: 'Wireless Earbuds', tag: 'TECH', image: 'https://images.pexels.com/photos/3783471/pexels-photo-3783471.jpeg' },
    { title: 'Fitness Watch', tag: 'FITNESS', image: 'https://images.pexels.com/photos/437039/pexels-photo-437039.jpeg' },
    { title: 'Organic Skincare', tag: 'BEAUTY', image: 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg' },
    { title: 'Smart Home', tag: 'HOME', image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg' },
    { title: 'Coffee Maker', tag: 'KITCHEN', image: 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg' },
    { title: 'Yoga Mat', tag: 'FITNESS', image: 'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg' },
  ];

  const testimonials = [
    {
      stars: 5,
      text: "HOBA magically turns product links into perfect marketing videos, saving time and boosting sales.",
      author: "Sophia Martinez",
      role: "Marketing Director",
      company: "Medium-sized Business",
    },
    {
      stars: 5,
      text: "The AI-generated hooks are incredibly effective. Our conversion rate jumped 40% in the first month.",
      author: "Mason Clark",
      role: "E-commerce Manager",
      company: "Small Business",
    },
    {
      stars: 5,
      text: "From product page to viral content in minutes. The 3 video concepts let us A/B test effortlessly.",
      author: "Elijah Walker",
      role: "Brand Manager",
      company: "Large Corporation",
    },
    {
      stars: 5,
      text: "Affordable and efficient. HOBA creates professional videos at a fraction of the cost of hiring editors.",
      author: "Mia Robinson",
      role: "Small Retailer",
      company: "Small Business",
    },
    {
      stars: 5,
      text: "The trend-aware storytelling frameworks actually work. Our TikTok views increased 10x.",
      author: "Noah Davis",
      role: "Social Media Manager",
      company: "Medium-sized Enterprise",
    },
  ];

  const faqs = [
    {
      q: "How does HOBA generate videos from a product URL?",
      a: "Simply paste your Shopify or WooCommerce product URL. Our AI automatically extracts the title, features, images, and reviews, then generates 3 unique video concepts with trending hooks optimized for TikTok, Instagram Reels, and YouTube Shorts."
    },
    {
      q: "Do I need any video editing experience?",
      a: "No! HOBA is designed for e-commerce sellers with zero video experience. Just paste a product link, review the 3 generated concepts, and download your videos. No filming, no editing, no complicated software."
    },
    {
      q: "What's included in each video?",
      a: "Each video includes: trending story hooks tailored to your product, professional AI voiceover, auto-generated captions for sound-off viewing, your brand colors and logo integration, royalty-free background music, and optimized 9:16 vertical format for all social platforms."
    },
    {
      q: "How long does it take to generate videos?",
      a: "Preview videos (8-10 seconds) are generated in 2-3 minutes for free. Final HD videos (20-24 seconds) take about 5-7 minutes. You can generate unlimited free previews to test different product URLs and concepts."
    },
    {
      q: "What makes HOBA different from other video tools?",
      a: "HOBA is purpose-built for product marketing. It uses trend-aware AI to create 3 distinct video concepts automatically, each using proven storytelling frameworks (POV, Question, Before-After). Plus, deterministic seeds let you iterate on hooks without re-rendering."
    },
    {
      q: "How does the credit system work?",
      a: "Previews are completely free - generate as many as you want! Only pay 3 credits when you're ready to download the final HD versions of your 3 videos. Credits never expire and can be used anytime."
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <TopNav variant="landing" />

      <section className="relative pt-24 lg:pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs text-yellow-400 mb-6">
                Powered by AI & GPT-4
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Turn{' '}
                <span className="text-yellow-400">products</span>
                {' '}into viral{' '}
                <span className="text-yellow-400">video ads</span>
              </h1>

              <p className="text-lg lg:text-xl text-gray-300 mb-8 leading-relaxed">
                Paste your product URL. Get 3 ready-to-post video ads with trending hooks, AI voiceovers, and captions—optimized for TikTok, Reels, and Shorts. Zero assets needed.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-5 h-5 bg-yellow-500/20 border border-yellow-500/30 rounded flex items-center justify-center">
                    <span className="text-yellow-400 text-xs">✓</span>
                  </div>
                  <span>Trend-aware hooks</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-5 h-5 bg-yellow-500/20 border border-yellow-500/30 rounded flex items-center justify-center">
                    <span className="text-yellow-400 text-xs">✓</span>
                  </div>
                  <span>Auto brand kit</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-5 h-5 bg-yellow-500/20 border border-yellow-500/30 rounded flex items-center justify-center">
                    <span className="text-yellow-400 text-xs">✓</span>
                  </div>
                  <span>3 concepts by default</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-5 h-5 bg-yellow-500/20 border border-yellow-500/30 rounded flex items-center justify-center">
                    <span className="text-yellow-400 text-xs">✓</span>
                  </div>
                  <span>Hook A/B testing</span>
                </div>
              </div>

              <form onSubmit={handleGetStarted} className="mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste your Shopify/WooCommerce product URL..."
                    className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent backdrop-blur-sm"
                  />
                  <button
                    type="submit"
                    className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    Get Started
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-black bg-gradient-to-br from-blue-500 to-purple-500"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-400">Trusted by 27,000+ creators</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'The Winter Collection', style: 'from-cyan-500/20 to-blue-600/20' },
                  { label: 'Premium Quality', style: 'from-orange-500/20 to-red-600/20' },
                  { label: 'Limited Edition', style: 'from-purple-500/20 to-pink-600/20' },
                  { label: 'Best Seller', style: 'from-green-500/20 to-emerald-600/20' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`relative aspect-[9/16] bg-gradient-to-br ${item.style} rounded-2xl overflow-hidden group cursor-pointer border border-white/10`}
                  >
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play size={28} className="text-white ml-1" fill="white" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white font-semibold text-sm drop-shadow-lg">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              From product page to viral content
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Paste your product URL and watch AI transform it into 3 scroll-stopping video ads in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exampleVideos.map((video, i) => (
              <div
                key={i}
                className="group relative aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-yellow-500/30 transition-all"
              >
                <img
                  src={video.image}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-cyan-500/90 text-black text-xs font-bold rounded-full">
                    {video.tag}
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-yellow-500/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play size={28} className="text-black ml-1" fill="black" />
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-bold text-lg drop-shadow-lg">{video.title}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/examples"
              className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-semibold"
            >
              See all examples
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-white/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              How it works
            </h2>
            <p className="text-lg text-gray-400">
              From product URL to platform-ready videos in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-yellow-400 font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Paste Product URL</h3>
                <p className="text-gray-400 leading-relaxed">
                  Drop your Shopify or WooCommerce product link. Our AI extracts title, features, images, and reviews automatically.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-yellow-400 font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">AI Generates 3 Concepts</h3>
                <p className="text-gray-400 leading-relaxed">
                  Get 3 unique video concepts with trending hooks (POV, Question, Before-After), scripts, and voiceovers—preview for free!
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-yellow-400 font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Download & Post</h3>
                <p className="text-gray-400 leading-relaxed">
                  Choose your favorites and download HD videos (9:16) with captions, music, and your branding—ready to post!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              What our users say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((review, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-yellow-500/30 transition-colors"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < review.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}
                    />
                  ))}
                </div>

                <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                  "{review.text}"
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {review.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{review.author}</div>
                    <div className="text-gray-500 text-xs">{review.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-white/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-white font-semibold text-base lg:text-lg pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-gray-400 flex-shrink-0 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openFaq === index && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-400 leading-relaxed text-sm lg:text-base">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to create viral product ads?
          </h2>
          <p className="text-lg lg:text-xl text-gray-400 mb-10">
            Join thousands of e-commerce brands using HOBA to drive sales
          </p>

          <Link
            to="/signin"
            className="inline-flex px-10 py-5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold transition-all hover:scale-105 text-lg"
          >
            Start Free Trial
            <ArrowRight size={22} className="ml-2" />
          </Link>

          <p className="text-sm text-gray-500 mt-6">
            No credit card required • 3 free videos • Cancel anytime
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>&copy; 2025 HOBA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
