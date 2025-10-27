// src/components/ProductPickerModal.tsx
import { useState, useEffect } from 'react';
import { X, Search, ShoppingBag } from 'lucide-react';
import { API_URL } from '../lib/config'; // ⬅️ make sure this exists (you already have it)

interface Product {
  id: string | number;
  handle: string;
  title: string;
  price: string; // backend sends string; if number, we stringify below
  images: string[];
}

interface ProductPickerModalProps {
  open: boolean;
  shopUrl: string;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

export function ProductPickerModal({ open, shopUrl, onClose, onSelect }: ProductPickerModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && shopUrl) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shopUrl]);

  const fetchProducts = async (query?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Build absolute URL against the API origin
      const url =
        `${API_URL}/api/products?shopUrl=${encodeURIComponent(shopUrl)}` +
        (query ? `&q=${encodeURIComponent(query)}` : '');

      const response = await fetch(url, { credentials: 'include' });

      // Handle HTTP errors
      if (!response.ok) {
        let message = 'Failed to fetch products';
        try {
          const j = await response.json();
          message = j?.error || j?.message || message;
        } catch { /* ignore */ }
        throw new Error(message);
      }

      const data = await response.json();

      // API returns { success, isShopify, count, items: [...] }
      const items = Array.isArray(data?.items) ? data.items : [];

      // normalize just in case (price can be number, images can be empty)
      const normalized: Product[] = items.map((p: any) => ({
        id: p.id ?? p.handle ?? crypto.randomUUID(),
        handle: p.handle ?? '',
        title: p.title ?? 'Untitled Product',
        price: typeof p.price === 'number' ? p.price.toFixed(2) : String(p.price ?? '0.00'),
        images: Array.isArray(p.images) ? p.images : [],
      }));

      setProducts(normalized);
    } catch (err) {
      setProducts([]);
      setError(err instanceof Error ? err.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(searchQuery);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Choose Product</h2>
              <p className="text-sm text-slate-400 mt-1">Select a product to create ads for</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-700">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}

          {error && (
            <div className="bg-red-950/30 border border-red-800 rounded-lg p-4 text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No products found</p>
              <p className="text-sm mt-2 text-slate-500">Try a different search or check the URL</p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800 hover:border-blue-500 transition-all"
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-48 object-cover bg-slate-700"
                    />
                  ) : (
                    <div className="w-full h-48 bg-slate-700 flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-slate-600" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">{product.title}</h3>
                    <p className="text-blue-400 font-bold mb-3">
                      ${/^\d/.test(product.price) ? product.price : '0.00'}
                    </p>
                    <button
                      onClick={() => {
                        onSelect(product);
                        onClose();
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Select Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
