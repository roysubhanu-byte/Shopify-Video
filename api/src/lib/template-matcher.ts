import { getSupabaseClient } from './supabase';
import { logger } from './logger';

interface StaticAdTemplate {
  id: string;
  template_name: string;
  category: string;
  brand_inspiration: string;
  layout_type: string;
  color_scheme: string;
  typography_style: string;
  composition_rule: string;
  mood_keywords: string[];
  text_overlay_position: string;
  background_treatment: string;
  best_for_products: string[];
  style_intensity: number;
  engagement_score: number;
  prompt_template: string;
}

interface ProductData {
  title: string;
  category?: string;
  vertical?: string;
  description?: string;
  keywords?: string[];
  price?: string;
  brandTone?: string;
}

export class TemplateMatcher {
  private supabase = getSupabaseClient();

  async findBestTemplate(productData: ProductData): Promise<StaticAdTemplate | null> {
    try {
      const { data: templates, error } = await this.supabase
        .from('static_ad_templates')
        .select('*')
        .order('engagement_score', { ascending: false });

      if (error || !templates || templates.length === 0) {
        logger.error('Failed to fetch templates', error);
        return null;
      }

      const scoredTemplates = templates.map(template => ({
        template,
        score: this.calculateMatchScore(template, productData)
      }));

      scoredTemplates.sort((a, b) => b.score - a.score);

      logger.info('Template matching results', {
        product: productData.title,
        topMatch: scoredTemplates[0]?.template.template_name,
        score: scoredTemplates[0]?.score
      });

      return scoredTemplates[0]?.template || null;
    } catch (error) {
      logger.error('Error in template matching', error);
      return null;
    }
  }

  async findTemplatesByCategory(category: string, limit: number = 5): Promise<StaticAdTemplate[]> {
    try {
      const { data: templates, error } = await this.supabase
        .from('static_ad_templates')
        .select('*')
        .eq('category', category)
        .order('engagement_score', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to fetch templates by category', error);
        return [];
      }

      return templates || [];
    } catch (error) {
      logger.error('Error fetching templates by category', error);
      return [];
    }
  }

  async getTemplateById(templateId: string): Promise<StaticAdTemplate | null> {
    try {
      const { data: template, error } = await this.supabase
        .from('static_ad_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        logger.error('Failed to fetch template by ID', error);
        return null;
      }

      return template;
    } catch (error) {
      logger.error('Error fetching template by ID', error);
      return null;
    }
  }

  private calculateMatchScore(template: StaticAdTemplate, productData: ProductData): number {
    let score = 0;

    score += this.categoryMatchScore(template, productData);
    score += this.keywordMatchScore(template, productData);
    score += this.brandToneMatchScore(template, productData);
    score += this.priceMatchScore(template, productData);
    score += template.engagement_score * 0.3;

    return score;
  }

  private categoryMatchScore(template: StaticAdTemplate, productData: ProductData): number {
    const productCategory = (productData.category || productData.vertical || '').toLowerCase();
    const templateCategory = template.category.toLowerCase();

    const categoryMap: Record<string, string[]> = {
      'athletic': ['sports', 'fitness', 'gym', 'athletic', 'running', 'workout', 'training'],
      'tech': ['technology', 'electronics', 'gadget', 'device', 'computer', 'phone', 'tech'],
      'luxury': ['luxury', 'premium', 'high-end', 'designer', 'exclusive', 'elegant'],
      'food_beverage': ['food', 'beverage', 'drink', 'snack', 'meal', 'restaurant', 'cafe'],
      'fashion_lifestyle': ['fashion', 'clothing', 'apparel', 'style', 'wear', 'accessory'],
      'beauty_wellness': ['beauty', 'cosmetics', 'skincare', 'wellness', 'health', 'spa'],
      'automotive': ['car', 'vehicle', 'automotive', 'auto', 'motorcycle', 'transport'],
      'minimal_clean': ['minimal', 'simple', 'clean', 'basic', 'essential', 'functional']
    };

    const templateCategories = categoryMap[templateCategory] || [];

    for (const cat of templateCategories) {
      if (productCategory.includes(cat)) {
        return 40;
      }
    }

    if (template.best_for_products) {
      for (const bestFor of template.best_for_products) {
        if (productCategory.includes(bestFor.toLowerCase()) ||
            productData.title.toLowerCase().includes(bestFor.toLowerCase())) {
          return 35;
        }
      }
    }

    return 0;
  }

  private keywordMatchScore(template: StaticAdTemplate, productData: ProductData): number {
    const productText = `${productData.title} ${productData.description || ''}`.toLowerCase();
    const productKeywords = productData.keywords || [];

    let matchCount = 0;

    if (template.mood_keywords) {
      for (const mood of template.mood_keywords) {
        if (productText.includes(mood.toLowerCase())) {
          matchCount++;
        }

        for (const keyword of productKeywords) {
          if (keyword.toLowerCase().includes(mood.toLowerCase())) {
            matchCount++;
          }
        }
      }
    }

    return Math.min(matchCount * 5, 25);
  }

  private brandToneMatchScore(template: StaticAdTemplate, productData: ProductData): number {
    const brandTone = (productData.brandTone || '').toLowerCase();
    if (!brandTone) return 0;

    const toneMap: Record<string, string[]> = {
      'luxury': ['luxury', 'premium', 'elegant', 'refined', 'prestigious'],
      'bold': ['bold', 'dynamic', 'energetic', 'powerful', 'strong'],
      'minimal': ['minimal', 'clean', 'simple', 'refined', 'minimal'],
      'playful': ['playful', 'fun', 'quirky', 'colorful', 'friendly'],
      'professional': ['professional', 'corporate', 'technical', 'trustworthy'],
      'natural': ['natural', 'organic', 'sustainable', 'authentic', 'earth']
    };

    for (const [tone, keywords] of Object.entries(toneMap)) {
      if (brandTone.includes(tone)) {
        for (const keyword of keywords) {
          if (template.mood_keywords?.includes(keyword)) {
            return 20;
          }
          if (template.template_name.toLowerCase().includes(keyword)) {
            return 15;
          }
        }
      }
    }

    return 0;
  }

  private priceMatchScore(template: StaticAdTemplate, productData: ProductData): number {
    if (!productData.price) return 0;

    const priceStr = productData.price.replace(/[^0-9.]/g, '');
    const price = parseFloat(priceStr);

    if (isNaN(price)) return 0;

    const isPremium = price > 100;
    const isBudget = price < 30;

    const templateName = template.template_name.toLowerCase();
    const isLuxuryTemplate = template.category === 'luxury' || templateName.includes('premium') || templateName.includes('luxury');
    const isAccessibleTemplate = templateName.includes('accessible') || templateName.includes('simple') || templateName.includes('democratic');

    if (isPremium && isLuxuryTemplate) return 15;
    if (isBudget && isAccessibleTemplate) return 15;
    if (!isPremium && !isBudget) return 10;

    return 0;
  }

  async getTemplateRecommendations(
    productData: ProductData,
    count: number = 3
  ): Promise<StaticAdTemplate[]> {
    try {
      const { data: templates, error } = await this.supabase
        .from('static_ad_templates')
        .select('*')
        .order('engagement_score', { ascending: false });

      if (error || !templates || templates.length === 0) {
        logger.error('Failed to fetch templates for recommendations', error);
        return [];
      }

      const scoredTemplates = templates.map(template => ({
        template,
        score: this.calculateMatchScore(template, productData)
      }));

      scoredTemplates.sort((a, b) => b.score - a.score);

      const recommendations = scoredTemplates.slice(0, count).map(st => st.template);

      logger.info('Template recommendations generated', {
        product: productData.title,
        recommendations: recommendations.map(r => r.template_name),
        count
      });

      return recommendations;
    } catch (error) {
      logger.error('Error getting template recommendations', error);
      return [];
    }
  }

  fillTemplatePrompt(template: StaticAdTemplate, productName: string): string {
    return template.prompt_template.replace(/{product}/g, productName);
  }
}

export const templateMatcher = new TemplateMatcher();
