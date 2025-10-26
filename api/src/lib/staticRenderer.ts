import sharp from 'sharp';
import { Logger } from './logger';

const logger = new Logger({ module: 'static-renderer' });

export interface StaticRenderOptions {
  width: number;
  height: number;
  backgroundImageUrl?: string;
  brandBg: string;
  accent: string;
  hookText: string;
  ctaText: string;
  position: 'top' | 'center' | 'bottom';
  logoPngUrl?: string;
}

function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getTextY(position: 'top' | 'center' | 'bottom', height: number): number {
  switch (position) {
    case 'top':
      return height * 0.2;
    case 'center':
      return height * 0.5;
    case 'bottom':
      return height * 0.75;
    default:
      return height * 0.5;
  }
}

export async function renderStaticPNG(options: StaticRenderOptions): Promise<Buffer> {
  const {
    width,
    height,
    backgroundImageUrl,
    brandBg,
    accent,
    hookText,
    ctaText,
    position,
    logoPngUrl,
  } = options;

  logger.info('Rendering static PNG', {
    width,
    height,
    hasBackground: !!backgroundImageUrl,
    position,
    hookLength: hookText.length,
  });

  const hookTextTruncated = truncateToWords(hookText, 6);
  const ctaTextTruncated = truncateToWords(ctaText, 4);

  const textY = getTextY(position, height);
  const ctaY = textY + 200;

  let backgroundLayer: sharp.Sharp;

  if (backgroundImageUrl) {
    try {
      const response = await fetch(backgroundImageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch background image: ${response.status}`);
      }
      const imageBuffer = Buffer.from(await response.arrayBuffer());

      backgroundLayer = sharp(imageBuffer)
        .resize(width, height, { fit: 'cover', position: 'center' })
        .composite([
          {
            input: Buffer.from(
              `<svg width="${width}" height="${height}">
                <rect width="${width}" height="${height}" fill="black" opacity="0.4"/>
              </svg>`
            ),
            top: 0,
            left: 0,
          },
        ]);
    } catch (error) {
      logger.warn('Failed to load background image, using brand color', { error });
      backgroundLayer = sharp({
        create: {
          width,
          height,
          channels: 4,
          background: brandBg,
        },
      });
    }
  } else {
    backgroundLayer = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: brandBg,
      },
    });
  }

  const hookTextSvg = `
    <svg width="${width}" height="${height}">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.8"/>
        </filter>
      </defs>
      <text
        x="${width / 2}"
        y="${textY}"
        font-family="Arial, sans-serif"
        font-size="80"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        filter="url(#shadow)"
      >
        ${escapeXml(hookTextTruncated).split(' ').map((word, i) =>
          `<tspan x="${width / 2}" dy="${i === 0 ? 0 : 90}">${word}</tspan>`
        ).join('')}
      </text>
    </svg>
  `;

  const ctaPillWidth = 400;
  const ctaPillHeight = 100;
  const ctaPillX = (width - ctaPillWidth) / 2;

  const ctaSvg = `
    <svg width="${width}" height="${height}">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.8"/>
        </filter>
      </defs>
      <rect
        x="${ctaPillX}"
        y="${ctaY}"
        width="${ctaPillWidth}"
        height="${ctaPillHeight}"
        rx="50"
        fill="${accent}"
        filter="url(#shadow)"
      />
      <text
        x="${width / 2}"
        y="${ctaY + 65}"
        font-family="Arial, sans-serif"
        font-size="48"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
      >
        ${escapeXml(ctaTextTruncated)}
      </text>
    </svg>
  `;

  const compositeInputs: sharp.OverlayOptions[] = [
    {
      input: Buffer.from(hookTextSvg),
      top: 0,
      left: 0,
    },
    {
      input: Buffer.from(ctaSvg),
      top: 0,
      left: 0,
    },
  ];

  if (logoPngUrl) {
    try {
      const logoResponse = await fetch(logoPngUrl);
      if (logoResponse.ok) {
        const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
        const logoSize = 120;
        const logoPadding = 40;

        const resizedLogo = await sharp(logoBuffer)
          .resize(logoSize, logoSize, { fit: 'inside' })
          .png()
          .toBuffer();

        compositeInputs.push({
          input: resizedLogo,
          top: height - logoSize - logoPadding,
          left: width - logoSize - logoPadding,
        });

        logger.info('Logo watermark added', { logoUrl: logoPngUrl });
      }
    } catch (error) {
      logger.warn('Failed to load logo, skipping watermark', { error });
    }
  }

  const finalImage = await backgroundLayer
    .composite(compositeInputs)
    .png()
    .toBuffer();

  logger.info('Static PNG rendered successfully', {
    bufferSize: finalImage.length,
    width,
    height,
  });

  return finalImage;
}
