import { useState } from 'react';
import { Link2, Loader2, Palette } from 'lucide-react';
import { i18n } from '../lib/i18n';

interface UrlFormProps {
  onSubmit: (url: string, vertical: string) => void;
  isLoading?: boolean;
  productData?: {
    title: string;
    images: string[];
  } | null;
  palette?: {
    primary: string;
    secondary: string;
    accent: string;
  } | null;
  logoUrl?: string | null;
}

export function UrlForm({ onSubmit, isLoading, productData, palette, logoUrl }: UrlFormProps) {
  const [url, setUrl] = useState('');
  const [vertical, setVertical] = useState('beauty');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim(), vertical);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Link2 size={20} />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={`Paste your ${i18n.labels.shopUrl}...`}
              className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {i18n.labels.vertical}
            </label>
            <select
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="beauty">Beauty & Cosmetics</option>
              <option value="fashion">Fashion & Apparel</option>
              <option value="electronics">Electronics & Gadgets</option>
              <option value="home">Home & Living</option>
              <option value="health">Health & Wellness</option>
              <option value="food">Food & Beverage</option>
              <option value="sports">Sports & Fitness</option>
              <option value="toys">Toys & Games</option>
              <option value="jewelry">Jewelry & Accessories</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="mt-4 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              {i18n.messages.ingesting}
            </>
          ) : (
            i18n.cta.generateHooks
          )}
        </button>
      </form>

      {productData && (palette || logoUrl) && (
        <div className="mt-6 p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
          <div className="flex items-start gap-6">
            {logoUrl && (
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden border border-slate-700">
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
                <p className="text-xs text-slate-500 text-center mt-1">Logo</p>
              </div>
            )}

            {palette && (
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Palette size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Brand Colors</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div
                      className="h-10 rounded-lg border border-slate-600"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <p className="text-xs text-slate-500 mt-1 text-center">Primary</p>
                  </div>
                  <div className="flex-1">
                    <div
                      className="h-10 rounded-lg border border-slate-600"
                      style={{ backgroundColor: palette.secondary }}
                    />
                    <p className="text-xs text-slate-500 mt-1 text-center">Secondary</p>
                  </div>
                  <div className="flex-1">
                    <div
                      className="h-10 rounded-lg border border-slate-600"
                      style={{ backgroundColor: palette.accent }}
                    />
                    <p className="text-xs text-slate-500 mt-1 text-center">Accent</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
