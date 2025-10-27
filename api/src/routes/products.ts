import { Router } from 'express';
import { Logger } from '../lib/logger';

const router = Router();
const logger = new Logger({ module: 'products-route' });

interface ShopifyProduct {
  id: number | string;
  handle: string;
  title: string;
  price: string;
  images: string[];
}

function toDomain(inputUrl: string): string {
  const u = new URL(inputUrl);
  return `${u.protocol}//${u.hostname}`;
}

/**
 * Try to fetch Shopify-style catalog. Works for both custom domains and *.myshopify.com
 * Returns null if endpoint is unavailable or malformed.
 */
async function tryFetchShopifyCatalog(domainUrl: string, query?: string): Promise<ShopifyProduct[] | null> {
  const url = `${domainUrl}/products.json${query ? `?limit=50&q=${encodeURIComponent(query)}` : '?limit=50'}`;

  try {
    logger.info('Attempting Shopify catalog fetch', { url });
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });

    if (!res.ok) {
      logger.warn('Shopify catalog fetch returned non-OK', { status: res.status, url });
      return null;
    }

    const data = (await res.json()) as { products?: any[] };
    if (!data?.products || !Array.isArray(data.products) || data.products.length === 0) {
      logger.warn('Shopify catalog empty or invalid shape', { url });
      return null;
    }

    const products: ShopifyProduct[] = data.products.map((p) => {
      const images = (p.images || [])
        .map((img: any) => img?.src || img?.url)
        .filter(Boolean);

      const price = (p.variants?.[0]?.price ?? p.price ?? '0.00').toString();

      return {
        id: p.id ?? p.handle ?? cryptoRandomId(),
        handle: p.handle ?? '',
        title: p.title ?? 'Untitled Product',
        price,
        images,
      };
    });

    logger.info('Shopify catalog fetched', { count: products.length });
    return products;
  } catch (error) {
    logger.error('Shopify catalog fetch error', { error, url });
    return null;
  }
}

/**
 * Very light-weight generic single-product detector.
 */
async function getGenericProduct(url: string): Promise<ShopifyProduct[]> {
  try {
    logger.info('Attempting generic product detection', { url });

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HobaBot/1.0)' },
    });

    if (!res.ok) {
      logger.warn('Generic product fetch failed', { status: res.status, url });
      return [];
    }

    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const title = (ogTitleMatch?.[1] || titleMatch?.[1] || 'Detected Product').split('|')[0].trim();

    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const imageTagMatch = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id)=["'][^"']*product[^"']*["']/i);
    const firstImage = ogImageMatch?.[1] || imageTagMatch?.[1] || '';

    const priceMatch = html.match(/\$\s*(\d+(?:\.\d{2})?)/);
    const price = priceMatch?.[1] || '0.00';

    const product: ShopifyProduct = {
      id: cryptoRandomId(),
      handle: new URL(url).pathname.split('/').filter(Boolean).pop() || 'product',
      title,
      price,
      images: firstImage ? [firstImage] : [],
    };

    logger.info('Generic product detected', {
      title: product.title,
      price: product.price,
      hasImage: product.images.length > 0,
    });

    return [product];
  } catch (error) {
    logger.error('Generic product detection error', { error, url });
    return [];
  }
}

function cryptoRandomId() {
  return `prod_${Math.random().toString(36).slice(2, 10)}`;
}

router.get('/api/products', async (req, res) => {
  try {
    const { shopUrl, q } = req.query;

    if (!shopUrl || typeof shopUrl !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: shopUrl',
        usage: 'GET /api/products?shopUrl=https://example.com&q=search',
      });
    }

    logger.info('Products request', { shopUrl, query: q });

    const domain = toDomain(shopUrl);

    // 1) Try Shopify first for ANY domain
    const shopifyProducts = await tryFetchShopifyCatalog(domain, typeof q === 'string' ? q : undefined);

    let items: ShopifyProduct[] = [];
    let isShopify = false;

    if (shopifyProducts && shopifyProducts.length > 0) {
      items = shopifyProducts;
      isShopify = true;
    } else {
      // 2) Fallback to generic single-product detection
      items = await getGenericProduct(shopUrl);
      isShopify = false;
    }

    res.json({
      success: true,
      isShopify,
      count: items.length,
      items,
    });
  } catch (error) {
    logger.error('Products endpoint error', { error });
    res.status(500).json({
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
