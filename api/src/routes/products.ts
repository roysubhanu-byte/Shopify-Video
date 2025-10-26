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

function isShopifyUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('myshopify.com') ||
         lowerUrl.includes('.shopify.com') ||
         lowerUrl.includes('shopify-stores');
}

async function scrapeShopifyProducts(shopUrl: string, query?: string): Promise<ShopifyProduct[]> {
  try {
    const baseUrl = new URL(shopUrl);
    const domain = `${baseUrl.protocol}//${baseUrl.hostname}`;

    const productsJsonUrl = `${domain}/products.json${query ? `?limit=50&q=${encodeURIComponent(query)}` : '?limit=50'}`;

    logger.info('Fetching Shopify products', { url: productsJsonUrl });

    const response = await fetch(productsJsonUrl);

    if (!response.ok) {
      logger.warn('Shopify products fetch failed', {
        status: response.status,
        url: productsJsonUrl
      });
      return [];
    }

    const data = await response.json() as { products?: any[] };

    if (!data.products || !Array.isArray(data.products)) {
      logger.warn('Invalid Shopify products response', { data });
      return [];
    }

    const products: ShopifyProduct[] = data.products.map((p) => {
      const images = p.images?.map((img: any) => img.src || img.url).filter(Boolean) || [];
      const price = p.variants?.[0]?.price || p.price || '0.00';

      return {
        id: p.id || p.handle,
        handle: p.handle || '',
        title: p.title || 'Untitled Product',
        price: price.toString(),
        images,
      };
    });

    logger.info('Shopify products fetched', { count: products.length });

    return products;

  } catch (error) {
    logger.error('Shopify scraping error', { error, shopUrl });
    return [];
  }
}

async function getGenericProduct(url: string): Promise<ShopifyProduct[]> {
  try {
    logger.info('Attempting generic product detection', { url });

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HobaBot/1.0)',
      },
    });

    if (!response.ok) {
      logger.warn('Generic product fetch failed', { status: response.status, url });
      return [];
    }

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const title = ogTitleMatch?.[1] || titleMatch?.[1] || 'Detected Product';

    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const imageTagMatch = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id)=["'][^"']*product[^"']*["']/i);
    const firstImage = ogImageMatch?.[1] || imageTagMatch?.[1] || '';

    const priceMatch = html.match(/\$\s*(\d+(?:\.\d{2})?)/);
    const price = priceMatch?.[1] || '0.00';

    const product: ShopifyProduct = {
      id: 'detected-1',
      handle: new URL(url).pathname.split('/').filter(Boolean).pop() || 'product',
      title: title.split('|')[0].trim(),
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

    let products: ShopifyProduct[] = [];

    if (isShopifyUrl(shopUrl)) {
      logger.info('Detected Shopify store', { shopUrl });
      products = await scrapeShopifyProducts(shopUrl, q as string | undefined);

      if (products.length === 0) {
        products = await getGenericProduct(shopUrl);
      }
    } else {
      logger.info('Non-Shopify URL, using generic detection', { shopUrl });
      products = await getGenericProduct(shopUrl);
    }

    res.json({
      success: true,
      isShopify: isShopifyUrl(shopUrl),
      count: products.length,
      items: products,
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
