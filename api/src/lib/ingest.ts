import { Logger } from './logger';

const logger = new Logger({ module: 'ingest' });

export interface ProductData {
  url: string;
  title: string;
  description?: string;
  bullets: string[];
  price?: number;
  currency?: string;
  images: string[];
  brandName?: string;
  brandColors: string[];
  reviews?: {
    average: number;
    count: number;
    topReview?: string;
  };
}

async function extractColorsFromImages(images: string[]): Promise<string[]> {
  return ['#FF6B35', '#004E89', '#F7B801', '#1A1A1A', '#FFFFFF'];
}

async function fetchHTML(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HobaBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error: any) {
    logger.error('Failed to fetch URL', error, { url });
    throw new Error(`Failed to fetch URL: ${error.message}`);
  }
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function extractJSONLD(html: string): any {
  const matches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  for (const match of matches) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'Product' || data['@graph']?.some((item: any) => item['@type'] === 'Product')) {
        return data['@type'] === 'Product' ? data : data['@graph'].find((item: any) => item['@type'] === 'Product');
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

function extractShopifyData(html: string): Partial<ProductData> | null {
  const productMatch = html.match(/meta\.product\s*=\s*(\{[\s\S]*?\});/);
  if (productMatch) {
    try {
      const product = JSON.parse(productMatch[1]);
      return {
        title: product.title,
        price: product.price / 100,
        currency: product.currency || 'USD',
        images: product.media?.filter((m: any) => m.media_type === 'image').map((m: any) => m.src) || [],
      };
    } catch (e) {
      // Continue with fallback
    }
  }

  return null;
}

function extractBullets(html: string): string[] {
  const bullets: string[] = [];

  const listPatterns = [
    /<ul[^>]*class=["'][^"']*features?[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi,
    /<ul[^>]*class=["'][^"']*benefits?[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi,
    /<div[^>]*class=["'][^"']*features?[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
  ];

  for (const pattern of listPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const listItems = match[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
      for (const item of listItems) {
        const text = item[1].replace(/<[^>]+>/g, '').trim();
        if (text.length > 10 && text.length < 200) {
          bullets.push(text);
        }
      }
    }
  }

  if (bullets.length === 0) {
    const description = extractMeta(html, 'og:description') || extractMeta(html, 'description') || '';
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 20);
    bullets.push(...sentences.slice(0, 3).map(s => s.trim()));
  }

  return bullets.slice(0, 5);
}

function extractBrandName(url: string, html: string): string {
  const siteName = extractMeta(html, 'og:site_name');
  if (siteName) return siteName;

  try {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    const parts = domain.split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch (e) {
    return 'Brand';
  }
}

export async function ingestProductURL(url: string): Promise<ProductData> {
  logger.info('Starting product ingest', { url });

  try {
    new URL(url);
  } catch (e) {
    throw new Error('Invalid URL format');
  }

  const html = await fetchHTML(url);
  const shopifyData = extractShopifyData(html);
  const jsonld = extractJSONLD(html);

  const title =
    shopifyData?.title ||
    jsonld?.name ||
    extractMeta(html, 'og:title') ||
    extractMeta(html, 'twitter:title') ||
    html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() ||
    'Product';

  const description =
    jsonld?.description ||
    extractMeta(html, 'og:description') ||
    extractMeta(html, 'description') ||
    '';

  const price =
    shopifyData?.price ||
    jsonld?.offers?.price ||
    parseFloat(extractMeta(html, 'product:price:amount') || '0');

  const currency =
    shopifyData?.currency ||
    jsonld?.offers?.priceCurrency ||
    extractMeta(html, 'product:price:currency') ||
    'USD';

  let images: string[] = shopifyData?.images || [];

  // Try JSON-LD structured data
  if (images.length === 0 && jsonld?.image) {
    images = Array.isArray(jsonld.image) ? jsonld.image : [jsonld.image];
  }

  // Try Open Graph images
  if (images.length === 0) {
    const ogImage = extractMeta(html, 'og:image');
    if (ogImage) images.push(ogImage);

    // Look for additional OG images
    const ogImageMatches = html.matchAll(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi);
    for (const match of ogImageMatches) {
      if (match[1] && !images.includes(match[1])) {
        images.push(match[1]);
      }
    }
  }

  // Aggressively extract images from common product image patterns
  if (images.length < 5) {
    const imagePatterns = [
      // Shopify CDN
      /https?:\/\/cdn\.shopify\.com\/s\/files\/[^\s"'>]+/g,
      // Generic product images
      /<img[^>]*src=["']([^"']+)["'][^>]*(?:class=["'][^"']*product[^"']*["']|alt=[^>]*product)/gi,
      /<img[^>]*(?:class=["'][^"']*product[^"']*["']|alt=[^>]*product)[^>]*src=["']([^"']+)["']/gi,
      // Gallery images
      /<img[^>]*src=["']([^"']+)["'][^>]*(?:class=["'][^"']*gallery[^"']*["'])/gi,
      // High-res images
      /<img[^>]*src=["']([^"']+)["'][^>]*(?:width=["'][5-9]\d{2,}|height=["'][5-9]\d{2,})/gi,
      // Data attributes commonly used for lazy loading
      /data-src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi,
      /data-image=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi,
    ];

    const extractedImages = new Set(images);

    for (const pattern of imagePatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        let imageUrl = match[1];

        // Skip if it's not a valid image URL
        if (!imageUrl || imageUrl.includes('logo') || imageUrl.includes('icon') || imageUrl.includes('sprite')) {
          continue;
        }

        // Convert relative URLs to absolute
        try {
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            const baseUrl = new URL(url);
            imageUrl = `${baseUrl.protocol}//${baseUrl.host}${imageUrl}`;
          }

          // Only add URLs that look like valid image URLs
          if (imageUrl.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) {
            extractedImages.add(imageUrl);
          }

          if (extractedImages.size >= 10) break;
        } catch (e) {
          continue;
        }
      }
      if (extractedImages.size >= 10) break;
    }

    images = Array.from(extractedImages);
  }

  // Clean and deduplicate images
  images = images
    .filter(img => img && img.startsWith('http'))
    .filter((img, index, self) => self.indexOf(img) === index)
    .slice(0, 10);

  logger.info('Image extraction complete', {
    url,
    extractedCount: images.length,
    images: images.map(i => i.substring(0, 80)),
  });

  const bullets = extractBullets(html);
  const brandName = extractBrandName(url, html);
  const brandColors = await extractColorsFromImages(images);

  let reviews: ProductData['reviews'] | undefined;
  if (jsonld?.aggregateRating) {
    reviews = {
      average: parseFloat(jsonld.aggregateRating.ratingValue) || 0,
      count: parseInt(jsonld.aggregateRating.reviewCount) || 0,
    };
  }

  const productData: ProductData = {
    url,
    title: title.substring(0, 100),
    description: description.substring(0, 500),
    bullets,
    price: price > 0 ? price : undefined,
    currency,
    images: images.slice(0, 5),
    brandName,
    brandColors,
    reviews,
  };

  logger.info('Product ingest complete', {
    url,
    title: productData.title,
    imageCount: productData.images.length,
    bulletCount: productData.bullets.length,
  });

  return productData;
}

export function validateProductData(data: ProductData): { valid: boolean; missing?: string[] } {
  const missing: string[] = [];

  if (!data.title || data.title.length < 5) missing.push('title');
  if (data.bullets.length === 0) missing.push('features/bullets');
  // Don't require images - allow proceeding without them
  // if (data.images.length === 0) missing.push('images');
  if (!data.brandName) missing.push('brand name');

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  };
}
