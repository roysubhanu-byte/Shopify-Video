import { Logger } from './logger';

const logger = new Logger({ module: 'brand-kit' });

export interface BrandKit {
  brandName: string;
  logoSvg: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  style: 'modern' | 'elegant' | 'playful' | 'bold';
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

export function generateWordmarkSVG(brandName: string, primaryColor: string, style: BrandKit['style']): string {
  const name = brandName.toUpperCase();
  const width = Math.max(300, name.length * 40);

  const styleSettings = {
    modern: { font: 'Arial, sans-serif', weight: 700, letterSpacing: 2 },
    elegant: { font: 'Georgia, serif', weight: 400, letterSpacing: 4 },
    playful: { font: 'Comic Sans MS, cursive', weight: 700, letterSpacing: 1 },
    bold: { font: 'Impact, sans-serif', weight: 900, letterSpacing: 0 },
  };

  const settings = styleSettings[style];

  return `<svg width="${width}" height="100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustBrightness(primaryColor, 20)};stop-opacity:1" />
    </linearGradient>
  </defs>
  <text
    x="50%"
    y="50%"
    font-family="${settings.font}"
    font-size="48"
    font-weight="${settings.weight}"
    letter-spacing="${settings.letterSpacing}"
    fill="url(#grad1)"
    text-anchor="middle"
    dominant-baseline="middle"
  >${name}</text>
</svg>`;
}

export function buildPalette(extractedColors: string[]): BrandKit['palette'] {
  const primary = extractedColors[0] || '#FF6B35';
  const secondary = extractedColors[1] || '#004E89';
  const accent = extractedColors[2] || '#F7B801';

  return {
    primary,
    secondary,
    accent,
    text: '#1A1A1A',
    background: '#FFFFFF',
  };
}

function getColorBrightness(hex: string): number {
  const num = parseInt(hex.replace('#', ''), 16);
  const R = (num >> 16) & 0xff;
  const G = (num >> 8) & 0xff;
  const B = num & 0xff;
  return (R * 299 + G * 587 + B * 114) / 1000 / 2.55;
}

export function determineStyle(brandName: string, palette: BrandKit['palette']): BrandKit['style'] {
  const name = brandName.toLowerCase();

  if (name.includes('luxe') || name.includes('elegant') || name.includes('premium')) {
    return 'elegant';
  }

  if (name.includes('fun') || name.includes('kids') || name.includes('play')) {
    return 'playful';
  }

  if (name.includes('power') || name.includes('strong') || name.includes('max')) {
    return 'bold';
  }

  const primaryBrightness = getColorBrightness(palette.primary);
  if (primaryBrightness < 50) {
    return 'elegant';
  }

  return 'modern';
}

export async function generateBrandKit(
  brandName: string,
  extractedColors: string[]
): Promise<BrandKit> {
  logger.info('Generating brand kit', { brandName, colorCount: extractedColors.length });

  const palette = buildPalette(extractedColors);
  const style = determineStyle(brandName, palette);
  const logoSvg = generateWordmarkSVG(brandName, palette.primary, style);

  const brandKit: BrandKit = {
    brandName,
    logoSvg,
    palette,
    style,
  };

  logger.info('Brand kit generated', { brandName, style });

  return brandKit;
}
