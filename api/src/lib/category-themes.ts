import { Logger } from './logger';
import { ProductCategory } from './storytelling-frameworks';

const logger = new Logger({ module: 'category-themes' });

/**
 * Category-specific visual theme for static image generation
 */
export interface CategoryTheme {
  category: ProductCategory;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    hookFont: string;
    hookSize: number;
    hookWeight: 'normal' | 'bold' | 'black';
    ctaFont: string;
    ctaSize: number;
    ctaWeight: 'normal' | 'bold' | 'black';
  };
  overlayStyle: {
    hookPosition: 'top' | 'center' | 'bottom';
    ctaPosition: 'top' | 'center' | 'bottom';
    backgroundOpacity: number;
    gradientOverlay: boolean;
  };
  visualStyle: string;
  emotionalTone: string;
}

/**
 * Pre-built category themes library
 */
export const CATEGORY_THEMES: Record<ProductCategory, CategoryTheme> = {
  beauty: {
    category: 'beauty',
    name: 'Elegant Beauty',
    description: 'Soft, sophisticated aesthetic perfect for beauty and skincare products',
    colors: {
      primary: '#E8B4B8',
      secondary: '#F5E6E8',
      accent: '#D4A5A5',
      background: '#FFF5F7',
      text: '#2D2424',
    },
    typography: {
      hookFont: 'Playfair Display, serif',
      hookSize: 72,
      hookWeight: 'bold',
      ctaFont: 'Montserrat, sans-serif',
      ctaSize: 52,
      ctaWeight: 'bold',
    },
    overlayStyle: {
      hookPosition: 'center',
      ctaPosition: 'bottom',
      backgroundOpacity: 0.25,
      gradientOverlay: true,
    },
    visualStyle: 'Soft lighting, pastel tones, elegant and feminine, luxury feel with gentle gradients',
    emotionalTone: 'Sophisticated, aspirational, self-care focused',
  },

  fitness: {
    category: 'fitness',
    name: 'Dynamic Energy',
    description: 'Bold, high-energy design for fitness and athletic products',
    colors: {
      primary: '#FF6B35',
      secondary: '#004E89',
      accent: '#FFD23F',
      background: '#1A1A2E',
      text: '#FFFFFF',
    },
    typography: {
      hookFont: 'Bebas Neue, Impact, sans-serif',
      hookSize: 84,
      hookWeight: 'black',
      ctaFont: 'Roboto Condensed, sans-serif',
      ctaSize: 56,
      ctaWeight: 'bold',
    },
    overlayStyle: {
      hookPosition: 'top',
      ctaPosition: 'bottom',
      backgroundOpacity: 0.4,
      gradientOverlay: true,
    },
    visualStyle: 'High contrast, dynamic angles, action-focused, energetic color pops',
    emotionalTone: 'Motivational, powerful, achievement-driven',
  },

  fashion: {
    category: 'fashion',
    name: 'Chic & Modern',
    description: 'Contemporary, stylish design for fashion and apparel',
    colors: {
      primary: '#2E2E3A',
      secondary: '#FFFFFF',
      accent: '#D4AF37',
      background: '#F5F5F5',
      text: '#1A1A1A',
    },
    typography: {
      hookFont: 'Futura, Century Gothic, sans-serif',
      hookSize: 78,
      hookWeight: 'bold',
      ctaFont: 'Helvetica Neue, Arial, sans-serif',
      ctaSize: 50,
      ctaWeight: 'bold',
    },
    overlayStyle: {
      hookPosition: 'center',
      ctaPosition: 'bottom',
      backgroundOpacity: 0.3,
      gradientOverlay: false,
    },
    visualStyle: 'Clean lines, minimalist, editorial magazine aesthetic, sophisticated',
    emotionalTone: 'Confident, stylish, trendsetting',
  },

  tech: {
    category: 'tech',
    name: 'Modern Tech',
    description: 'Clean, futuristic design for technology and gadgets',
    colors: {
      primary: '#667EEA',
      secondary: '#764BA2',
      accent: '#00D4FF',
      background: '#0F0F1E',
      text: '#FFFFFF',
    },
    typography: {
      hookFont: 'Inter, Roboto, sans-serif',
      hookSize: 76,
      hookWeight: 'bold',
      ctaFont: 'SF Pro Display, sans-serif',
      ctaSize: 54,
      ctaWeight: 'bold',
    },
    overlayStyle: {
      hookPosition: 'top',
      ctaPosition: 'bottom',
      backgroundOpacity: 0.35,
      gradientOverlay: true,
    },
    visualStyle: 'Sleek gradients, modern UI elements, tech-forward, digital aesthetic',
    emotionalTone: 'Innovative, cutting-edge, smart',
  },

  home: {
    category: 'home',
    name: 'Cozy Home',
    description: 'Warm, inviting design for home and lifestyle products',
    colors: {
      primary: '#8B7355',
      secondary: '#E8DDD3',
      accent: '#D9A574',
      background: '#FAFAF8',
      text: '#3D3026',
    },
    typography: {
      hookFont: 'Georgia, Merriweather, serif',
      hookSize: 70,
      hookWeight: 'bold',
      ctaFont: 'Open Sans, sans-serif',
      ctaSize: 48,
      ctaWeight: 'bold',
    },
    overlayStyle: {
      hookPosition: 'center',
      ctaPosition: 'bottom',
      backgroundOpacity: 0.2,
      gradientOverlay: true,
    },
    visualStyle: 'Warm tones, natural lighting, cozy atmosphere, inviting spaces',
    emotionalTone: 'Comfortable, welcoming, homey',
  },

  jewelry: {
    category: 'jewelry',
    name: 'Luxury Elegance',
    description: 'Premium, luxurious design for jewelry and accessories',
    colors: {
      primary: '#D4AF37',
      secondary: '#1A1A1A',
      accent: '#C9B037',
      background: '#0A0A0A',
      text: '#F5F5F5',
    },
    typography: {
      hookFont: 'Bodoni MT, Didot, serif',
      hookSize: 80,
      hookWeight: 'bold',
      ctaFont: 'Cormorant Garamond, serif',
      ctaSize: 54,
      ctaWeight: 'bold',
    },
    overlayStyle: {
      hookPosition: 'center',
      ctaPosition: 'bottom',
      backgroundOpacity: 0.3,
      gradientOverlay: true,
    },
    visualStyle: 'Dark dramatic lighting, metallic accents, premium feel, elegant composition',
    emotionalTone: 'Luxurious, exclusive, sophisticated',
  },

  food: {
    category: 'food',
    name: 'Fresh & Appetizing',
    description: 'Vibrant, appetizing design for food and beverage products',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      background: '#FFF8E7',
      text: '#2F4858',
    },
    typography: {
      hookFont: 'Poppins, sans-serif',
      hookSize: 74,
      hookWeight: 'bold',
      ctaFont: 'Nunito, sans-serif',
      ctaSize: 52,
      ctaWeight: 'bold',
    },
    overlayStyle: {
      hookPosition: 'top',
      ctaPosition: 'bottom',
      backgroundOpacity: 0.25,
      gradientOverlay: true,
    },
    visualStyle: 'Bright natural lighting, appetizing colors, fresh feel, mouth-watering presentation',
    emotionalTone: 'Delicious, satisfying, indulgent',
  },

  wellness: {
    category: 'wellness',
    name: 'Calm Wellness',
    description: 'Serene, peaceful design for wellness and health products',
    colors: {
      primary: '#7FB3D5',
      secondary: '#B8E0D2',
      accent: '#95E1D3',
      background: '#F2F9F9',
      text: '#2C5F66',
    },
    typography: {
      hookFont: 'Lora, Georgia, serif',
      hookSize: 68,
      hookWeight: 'bold',
      ctaFont: 'Source Sans Pro, sans-serif',
      ctaSize: 50,
      ctaWeight: 'bold',
    },
    overlayStyle: {
      hookPosition: 'center',
      ctaPosition: 'bottom',
      backgroundOpacity: 0.2,
      gradientOverlay: true,
    },
    visualStyle: 'Soft natural lighting, calming colors, peaceful atmosphere, balanced composition',
    emotionalTone: 'Peaceful, nurturing, balanced',
  },

  lifestyle: {
    category: 'lifestyle',
    name: 'Aspirational Life',
    description: 'Inspiring, elevated design for lifestyle products',
    colors: {
      primary: '#5C6BC0',
      secondary: '#FFA726',
      accent: '#26C6DA',
      background: '#FAFAFA',
      text: '#212121',
    },
    typography: {
      hookFont: 'Raleway, sans-serif',
      hookSize: 76,
      hookWeight: 'bold',
      ctaFont: 'Lato, sans-serif',
      ctaSize: 52,
      ctaWeight: 'bold',
    },
    overlayStyle: {
      hookPosition: 'center',
      ctaPosition: 'bottom',
      backgroundOpacity: 0.3,
      gradientOverlay: true,
    },
    visualStyle: 'Magazine-quality, aspirational imagery, golden hour lighting, elevated aesthetic',
    emotionalTone: 'Aspirational, inspiring, elevated',
  },

  general: {
    category: 'general',
    name: 'Universal Appeal',
    description: 'Versatile, professional design for any product type',
    colors: {
      primary: '#3B82F6',
      secondary: '#6366F1',
      accent: '#10B981',
      background: '#F9FAFB',
      text: '#111827',
    },
    typography: {
      hookFont: 'Inter, sans-serif',
      hookSize: 72,
      hookWeight: 'bold',
      ctaFont: 'Inter, sans-serif',
      ctaSize: 50,
      ctaWeight: 'bold',
    },
    overlayStyle: {
      hookPosition: 'top',
      ctaPosition: 'bottom',
      backgroundOpacity: 0.3,
      gradientOverlay: true,
    },
    visualStyle: 'Professional, clean, balanced, modern aesthetic with broad appeal',
    emotionalTone: 'Professional, trustworthy, accessible',
  },
};

/**
 * Get theme for a specific category
 */
export function getThemeForCategory(category: ProductCategory): CategoryTheme {
  return CATEGORY_THEMES[category] || CATEGORY_THEMES.general;
}

/**
 * Get theme with brand color override
 */
export function getThemeWithBrandColors(
  category: ProductCategory,
  brandColors?: { primary?: string; secondary?: string; accent?: string }
): CategoryTheme {
  const baseTheme = getThemeForCategory(category);

  if (!brandColors) {
    return baseTheme;
  }

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...(brandColors.primary && { primary: brandColors.primary }),
      ...(brandColors.secondary && { secondary: brandColors.secondary }),
      ...(brandColors.accent && { accent: brandColors.accent }),
    },
  };
}

/**
 * Generate CSS styles from theme
 */
export function generateThemeStyles(theme: CategoryTheme): Record<string, any> {
  return {
    hookText: {
      fontFamily: theme.typography.hookFont,
      fontSize: theme.typography.hookSize,
      fontWeight: theme.typography.hookWeight,
      color: theme.colors.text,
    },
    ctaText: {
      fontFamily: theme.typography.ctaFont,
      fontSize: theme.typography.ctaSize,
      fontWeight: theme.typography.ctaWeight,
      color: theme.colors.text,
    },
    overlay: {
      backgroundColor: theme.colors.background,
      opacity: theme.overlayStyle.backgroundOpacity,
      gradient: theme.overlayStyle.gradientOverlay
        ? `linear-gradient(180deg, ${theme.colors.primary}00 0%, ${theme.colors.primary}80 100%)`
        : 'none',
    },
    colors: theme.colors,
  };
}

/**
 * Get all available themes
 */
export function getAllThemes(): CategoryTheme[] {
  return Object.values(CATEGORY_THEMES);
}

/**
 * Merge theme with brand kit colors
 */
export function mergeThemeWithBrandKit(
  theme: CategoryTheme,
  brandKit: {
    palette: { primary: string; secondary: string; accent: string };
    style?: string;
  }
): CategoryTheme {
  logger.info('Merging theme with brand kit', {
    category: theme.category,
    brandPrimary: brandKit.palette.primary,
  });

  return {
    ...theme,
    colors: {
      ...theme.colors,
      primary: brandKit.palette.primary,
      accent: brandKit.palette.accent,
    },
    visualStyle: brandKit.style
      ? `${theme.visualStyle}, ${brandKit.style}`
      : theme.visualStyle,
  };
}

/**
 * Get theme recommendations based on product data
 */
export function recommendTheme(productData: {
  title: string;
  description: string;
  bullets: string[];
  category: ProductCategory;
}): {
  primaryTheme: CategoryTheme;
  alternativeThemes: CategoryTheme[];
} {
  const primaryTheme = getThemeForCategory(productData.category);

  // Get alternative themes that might work well
  const alternatives: ProductCategory[] = [];

  switch (productData.category) {
    case 'beauty':
      alternatives.push('wellness', 'lifestyle');
      break;
    case 'fitness':
      alternatives.push('lifestyle', 'wellness');
      break;
    case 'fashion':
      alternatives.push('jewelry', 'lifestyle');
      break;
    case 'tech':
      alternatives.push('general', 'lifestyle');
      break;
    case 'jewelry':
      alternatives.push('fashion', 'lifestyle');
      break;
    default:
      alternatives.push('general', 'lifestyle');
  }

  const alternativeThemes = alternatives.map(cat => CATEGORY_THEMES[cat]);

  logger.info('Theme recommendation generated', {
    category: productData.category,
    primaryTheme: primaryTheme.name,
    alternatives: alternativeThemes.map(t => t.name),
  });

  return {
    primaryTheme,
    alternativeThemes,
  };
}
