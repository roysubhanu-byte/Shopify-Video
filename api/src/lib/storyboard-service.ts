/**
 * Storyboard Generation Service
 * Uses Gemini API to generate 4-shot video storyboards
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from './logger.js';

export interface ProductContext {
  name: string;
  description: string;
  bullets: string[];
  brandName: string;
  price?: number;
  currency?: string;
}

export interface TargetAudience {
  ageRange?: string;
  gender?: string;
  location?: string;
  incomeLevel?: string;
}

export interface StoryboardConfig {
  product: ProductContext;
  messaging: string;
  targetAudience?: TargetAudience;
  sellingPoints: string[];
  ctaText: string;
  selectedImages: string[]; // URLs of the 4 selected product images
}

export interface StoryboardShot {
  shotNumber: number;
  duration: number; // seconds
  visualDescription: string;
  cameraMovement: string;
  productImage: string; // URL of the image to use as reference
  textOverlay: string;
  voiceoverText: string;
  enhancedPrompt: string; // VEO3-optimized prompt
}

export interface Storyboard {
  shots: StoryboardShot[];
  totalDuration: number;
  concept: string;
}

/**
 * Generate a 4-shot storyboard using Gemini
 */
export async function generateStoryboard(
  config: StoryboardConfig
): Promise<Storyboard> {
  logger.info('Generating storyboard with Gemini', {
    product: config.product.name,
    messaging: config.messaging.substring(0, 50),
  });

  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Build prompt for Gemini
  const prompt = buildStoryboardPrompt(config);

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    logger.info('Gemini response received', {
      responseLength: text.length,
    });

    // Parse the JSON response
    const storyboard = parseStoryboardResponse(text, config);

    // Enhance each shot's prompt for VEO3
    for (const shot of storyboard.shots) {
      shot.enhancedPrompt = await enhancePromptForVeo3(shot, config.product);
    }

    logger.info('Storyboard generation complete', {
      shotCount: storyboard.shots.length,
      totalDuration: storyboard.totalDuration,
    });

    return storyboard;
  } catch (error) {
    logger.error('Storyboard generation failed', { error });
    throw new Error(
      `Failed to generate storyboard: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build the prompt for Gemini to generate a storyboard
 */
function buildStoryboardPrompt(config: StoryboardConfig): string {
  const audienceStr = config.targetAudience
    ? `Target audience: ${config.targetAudience.ageRange || 'all ages'}, ${config.targetAudience.gender || 'all genders'}, ${config.targetAudience.location || 'global'}, ${config.targetAudience.incomeLevel || 'all income levels'}`
    : 'Target audience: General consumers';

  const sellingPointsStr = config.sellingPoints.length > 0
    ? config.sellingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')
    : 'None specified';

  return `You are a professional video advertising creative director. Create a compelling 4-shot video storyboard for a product advertisement.

PRODUCT INFORMATION:
- Product Name: ${config.product.name}
- Brand: ${config.product.brandName}
- Description: ${config.product.description}
- Price: ${config.product.price ? `${config.product.currency}${config.product.price}` : 'Not specified'}
- Key Features:
${config.product.bullets.map((b, i) => `  ${i + 1}. ${b}`).join('\n')}

MARKETING REQUIREMENTS:
- Core Message/Theme: ${config.messaging}
- ${audienceStr}
- Key Selling Points:
${sellingPointsStr}
- Call-to-Action: ${config.ctaText}

VIDEO STRUCTURE:
Create exactly 4 shots, each 6 seconds long (24 seconds total), following this structure:

Shot 1 (HOOK - 6 seconds):
- Grab attention immediately
- Use the first selected product image
- Set the tone and create curiosity
- Text overlay should be the first 6 words of the voiceover

Shot 2 (PROBLEM/FEATURE - 6 seconds):
- Showcase a key product feature or address a pain point
- Use the second selected product image
- Build on the hook with specific product benefits
- Text overlay should highlight the main feature

Shot 3 (BENEFIT/SOLUTION - 6 seconds):
- Show the product in use or demonstrate the transformation
- Use the third selected product image
- Emphasize the emotional benefit or outcome
- Text overlay should reinforce the benefit

Shot 4 (CALL-TO-ACTION - 6 seconds):
- Strong closing with clear CTA
- Use the fourth selected product image
- Include pricing if compelling
- Text overlay should be the CTA: "${config.ctaText}"

IMPORTANT GUIDELINES:
- Each shot must be exactly 6 seconds
- Visual descriptions should be clear, specific, and actionable
- Camera movements should be smooth and purposeful (static, slow zoom, pan)
- Voiceover should be concise and conversational
- Text overlays should be short (max 6 words per shot)
- Maintain brand tone and target audience throughout
- Focus on visual storytelling, not technical camera jargon

OUTPUT FORMAT:
Respond ONLY with valid JSON in this exact format:
{
  "concept": "Brief 1-sentence overview of the video concept",
  "shots": [
    {
      "shotNumber": 1,
      "duration": 6,
      "visualDescription": "Clear description of what's shown on screen",
      "cameraMovement": "static/slow zoom in/slow zoom out/pan left/pan right",
      "textOverlay": "Short text (max 6 words)",
      "voiceoverText": "Full narration for this shot"
    },
    ...repeat for all 4 shots
  ]
}

Generate the storyboard now:`;
}

/**
 * Parse Gemini's JSON response into a Storyboard
 */
function parseStoryboardResponse(
  text: string,
  config: StoryboardConfig
): Storyboard {
  try {
    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonText);

    if (!parsed.shots || !Array.isArray(parsed.shots)) {
      throw new Error('Invalid storyboard format: missing shots array');
    }

    if (parsed.shots.length !== 4) {
      throw new Error(`Expected 4 shots, got ${parsed.shots.length}`);
    }

    // Map parsed shots to StoryboardShot format
    const shots: StoryboardShot[] = parsed.shots.map((shot: any, index: number) => ({
      shotNumber: shot.shotNumber || index + 1,
      duration: 6, // Always 6 seconds per shot
      visualDescription: shot.visualDescription || '',
      cameraMovement: shot.cameraMovement || 'static',
      productImage: config.selectedImages[index] || '', // Assign image in order
      textOverlay: shot.textOverlay || '',
      voiceoverText: shot.voiceoverText || '',
      enhancedPrompt: '', // Will be filled later
    }));

    return {
      shots,
      totalDuration: 24, // 4 shots × 6 seconds
      concept: parsed.concept || 'Product advertisement',
    };
  } catch (error) {
    logger.error('Failed to parse storyboard response', { error, text: text.substring(0, 200) });
    throw new Error('Failed to parse storyboard from Gemini response');
  }
}

/**
 * Enhance a shot's visual description into a VEO3-optimized prompt
 */
async function enhancePromptForVeo3(
  shot: StoryboardShot,
  product: ProductContext
): Promise<string> {
  // For now, create a simple but effective VEO3 prompt
  // In production, you could call Gemini again for enhancement

  let prompt = shot.visualDescription;

  // Add camera movement if specified
  if (shot.cameraMovement && shot.cameraMovement !== 'static') {
    prompt += `. Camera: ${shot.cameraMovement}`;
  }

  // Add product context
  prompt += `. Product: ${product.name}`;

  // Add brand styling
  prompt += `. Professional product photography style, clean background, high quality lighting`;

  // Keep it concise for VEO3
  if (prompt.length > 300) {
    prompt = prompt.substring(0, 297) + '...';
  }

  return prompt;
}

/**
 * Combine all shots into a single cohesive VEO3 prompt
 */
export function combineStoryboardIntoPrompt(storyboard: Storyboard): string {
  const shotDescriptions = storyboard.shots.map((shot, index) => {
    return `[${shot.duration * index}-${shot.duration * (index + 1)}s] ${shot.enhancedPrompt}`;
  });

  return shotDescriptions.join(' ');
}
