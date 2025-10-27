import { Logger } from './logger';
import { z } from 'zod';

const logger = new Logger({ module: 'structured-prompt-templates' });

export const CameraMoveSchema = z.enum([
  'push-in',
  'pull-out',
  'whip-pan',
  'lock-off',
  'orbit',
  'handheld',
  'static',
]);
export type CameraMove = z.infer<typeof CameraMoveSchema>;

export const StructuredPromptSchema = z.object({
  goal: z.string().min(10).max(200).describe('Primary objective of the video'),
  audience: z.string().min(5).max(100).describe('Target demographic'),
  shots: z
    .array(
      z.object({
        beatType: z.enum(['hook', 'demo', 'proof', 'cta']),
        description: z.string().min(10).max(300),
        duration: z.number().min(3).max(8),
        cameraMove: CameraMoveSchema.optional(),
        focus: z.string().optional(),
      })
    )
    .length(4),
  text: z
    .array(
      z.object({
        content: z.string().min(1).max(50),
        timing: z.enum(['start', 'middle', 'end']),
        emphasis: z.enum(['normal', 'strong', 'subtle']).optional(),
      })
    )
    .min(1),
  cta: z.object({
    text: z.string().min(3).max(30),
    url: z.string().url().optional(),
    position: z.enum(['bottom-center', 'bottom-right', 'center']).optional(),
  }),
});

export type StructuredPrompt = z.infer<typeof StructuredPromptSchema>;

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  template: StructuredPrompt;
  variables: string[];
  examples: Array<{
    productType: string;
    filled: StructuredPrompt;
  }>;
}

export class StructuredPromptManager {
  private templates: Map<string, PromptTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    const problemSolutionTemplate: PromptTemplate = {
      id: 'problem-solution',
      name: 'Problem-Solution',
      category: 'general',
      description: 'Identify a pain point and present your product as the solution',
      template: {
        goal: 'Show how {{product}} solves {{problem}} for {{audience}}',
        audience: '{{target_demographic}} who struggle with {{pain_point}}',
        shots: [
          {
            beatType: 'hook',
            description: 'Person experiencing {{problem}} with frustration',
            duration: 3,
            cameraMove: 'lock-off',
            focus: 'facial expression',
          },
          {
            beatType: 'demo',
            description: '{{product}} being used to solve {{problem}}',
            duration: 6,
            cameraMove: 'push-in',
            focus: 'product features',
          },
          {
            beatType: 'proof',
            description: 'Happy customer showing results after using {{product}}',
            duration: 6,
            cameraMove: 'handheld',
            focus: 'transformation',
          },
          {
            beatType: 'cta',
            description: 'Product packshot with brand logo and {{cta_text}}',
            duration: 3,
            cameraMove: 'static',
            focus: 'branding',
          },
        ],
        text: [
          { content: 'Tired of {{problem}}?', timing: 'start', emphasis: 'strong' },
          { content: 'Meet {{product}}', timing: 'middle', emphasis: 'normal' },
          { content: '{{benefit}}', timing: 'middle', emphasis: 'normal' },
          { content: '{{cta_text}}', timing: 'end', emphasis: 'strong' },
        ],
        cta: {
          text: '{{cta_text}}',
          position: 'bottom-center',
        },
      },
      variables: [
        'product',
        'problem',
        'pain_point',
        'audience',
        'target_demographic',
        'benefit',
        'cta_text',
      ],
      examples: [
        {
          productType: 'Fitness App',
          filled: {
            goal:
              'Show how FitPro solves inconsistent workout routines for busy professionals',
            audience:
              'Working professionals who struggle with finding time to exercise',
            shots: [
              {
                beatType: 'hook',
                description:
                  'Person experiencing stress about missed workouts with frustration',
                duration: 3,
                cameraMove: 'lock-off',
                focus: 'facial expression',
              },
              {
                beatType: 'demo',
                description:
                  'FitPro app being used to schedule quick 15-minute workouts',
                duration: 6,
                cameraMove: 'push-in',
                focus: 'product features',
              },
              {
                beatType: 'proof',
                description:
                  'Happy customer showing fitness progress after using FitPro',
                duration: 6,
                cameraMove: 'handheld',
                focus: 'transformation',
              },
              {
                beatType: 'cta',
                description:
                  'Product packshot with brand logo and Try Free for 7 Days',
                duration: 3,
                cameraMove: 'static',
                focus: 'branding',
              },
            ],
            text: [
              { content: 'Tired of missing workouts?', timing: 'start', emphasis: 'strong' },
              { content: 'Meet FitPro', timing: 'middle', emphasis: 'normal' },
              { content: 'Get fit in just 15 minutes', timing: 'middle', emphasis: 'normal' },
              { content: 'Try Free for 7 Days', timing: 'end', emphasis: 'strong' },
            ],
            cta: {
              text: 'Try Free for 7 Days',
              position: 'bottom-center',
            },
          },
        },
      ],
    };

    const beforeAfterTemplate: PromptTemplate = {
      id: 'before-after',
      name: 'Before-After Transformation',
      category: 'transformation',
      description: 'Show dramatic transformation using your product',
      template: {
        goal: 'Demonstrate visible {{transformation_type}} from using {{product}}',
        audience: '{{target_demographic}} seeking {{desired_outcome}}',
        shots: [
          {
            beatType: 'hook',
            description: 'Before state showing {{problem_state}}',
            duration: 3,
            cameraMove: 'lock-off',
            focus: 'current state',
          },
          {
            beatType: 'demo',
            description: 'Quick montage of using {{product}} over {{timeframe}}',
            duration: 6,
            cameraMove: 'whip-pan',
            focus: 'product usage',
          },
          {
            beatType: 'proof',
            description: 'After state showing dramatic {{transformation_type}}',
            duration: 6,
            cameraMove: 'push-in',
            focus: 'results',
          },
          {
            beatType: 'cta',
            description: 'Split-screen before/after with {{cta_text}}',
            duration: 3,
            cameraMove: 'static',
            focus: 'comparison',
          },
        ],
        text: [
          { content: 'Before {{product}}', timing: 'start', emphasis: 'normal' },
          { content: '{{timeframe}} later', timing: 'middle', emphasis: 'normal' },
          { content: '{{result_metric}}', timing: 'middle', emphasis: 'strong' },
          { content: '{{cta_text}}', timing: 'end', emphasis: 'strong' },
        ],
        cta: {
          text: '{{cta_text}}',
          position: 'bottom-center',
        },
      },
      variables: [
        'product',
        'transformation_type',
        'problem_state',
        'desired_outcome',
        'target_demographic',
        'timeframe',
        'result_metric',
        'cta_text',
      ],
      examples: [],
    };

    const socialProofTemplate: PromptTemplate = {
      id: 'social-proof',
      name: 'Social Proof & Reviews',
      category: 'trust',
      description: 'Leverage customer reviews and social validation',
      template: {
        goal: 'Build trust through real customer experiences with {{product}}',
        audience: 'Skeptical buyers considering {{product_category}}',
        shots: [
          {
            beatType: 'hook',
            description: 'Display of {{review_count}}+ 5-star reviews scrolling',
            duration: 3,
            cameraMove: 'static',
            focus: 'social proof',
          },
          {
            beatType: 'demo',
            description: 'Real customer testimonial clips showing {{product}} benefits',
            duration: 6,
            cameraMove: 'handheld',
            focus: 'authentic reactions',
          },
          {
            beatType: 'proof',
            description: 'Montage of before/after user-generated content',
            duration: 6,
            cameraMove: 'whip-pan',
            focus: 'results variety',
          },
          {
            beatType: 'cta',
            description: 'Product with {{rating}} stars and {{cta_text}}',
            duration: 3,
            cameraMove: 'push-in',
            focus: 'trust signals',
          },
        ],
        text: [
          { content: '★{{rating}} {{review_count}} Reviews', timing: 'start', emphasis: 'strong' },
          { content: '"{{testimonial_quote}}"', timing: 'middle', emphasis: 'normal' },
          { content: 'Join {{customer_count}} happy customers', timing: 'middle', emphasis: 'normal' },
          { content: '{{cta_text}}', timing: 'end', emphasis: 'strong' },
        ],
        cta: {
          text: '{{cta_text}}',
          position: 'bottom-center',
        },
      },
      variables: [
        'product',
        'product_category',
        'review_count',
        'rating',
        'testimonial_quote',
        'customer_count',
        'cta_text',
      ],
      examples: [],
    };

    this.templates.set('problem-solution', problemSolutionTemplate);
    this.templates.set('before-after', beforeAfterTemplate);
    this.templates.set('social-proof', socialProofTemplate);

    logger.info('Structured prompt templates initialized', {
      count: this.templates.size,
      templates: Array.from(this.templates.keys()),
    });
  }

  getTemplate(id: string): PromptTemplate | null {
    return this.templates.get(id) || null;
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.category === category);
  }

  validatePrompt(prompt: StructuredPrompt): { valid: boolean; errors: string[] } {
    try {
      StructuredPromptSchema.parse(prompt);

      const errors: string[] = [];

      if (prompt.shots.length !== 4) {
        errors.push('Must have exactly 4 shots (hook, demo, proof, cta)');
      }

      const totalDuration = prompt.shots.reduce((sum, shot) => sum + shot.duration, 0);
      if (totalDuration < 18 || totalDuration > 24) {
        errors.push(`Total duration must be 18-24s, got ${totalDuration}s`);
      }

      const beatTypes = prompt.shots.map((s) => s.beatType);
      if (
        !beatTypes.includes('hook') ||
        !beatTypes.includes('demo') ||
        !beatTypes.includes('proof') ||
        !beatTypes.includes('cta')
      ) {
        errors.push('Missing required beat types: hook, demo, proof, cta');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Zod v4 => use `issues` (not `errors`)
        const errors = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
        return { valid: false, errors };
      }
      return { valid: false, errors: ['Unknown validation error'] };
    }
  }

  fillTemplate(templateId: string, variables: Record<string, string>): StructuredPrompt | null {
    const template = this.getTemplate(templateId);
    if (!template) {
      logger.error('Template not found', { templateId });
      return null;
    }

    const missingVars = template.variables.filter((v) => !variables[v]);
    if (missingVars.length > 0) {
      logger.error('Missing required variables', { templateId, missingVars });
      return null;
    }

    const filled = JSON.parse(JSON.stringify(template.template));

    const replaceVariables = (obj: any): any => {
      if (typeof obj === 'string') {
        let result = obj;
        for (const [key, value] of Object.entries(variables)) {
          result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return result;
      }
      if (Array.isArray(obj)) {
        return obj.map(replaceVariables);
      }
      if (typeof obj === 'object' && obj !== null) {
        const newObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
          newObj[key] = replaceVariables(value);
        }
        return newObj;
      }
      return obj;
    };

    const filledPrompt = replaceVariables(filled);

    logger.info('Template filled with variables', {
      templateId,
      variableCount: Object.keys(variables).length,
    });

    return filledPrompt as StructuredPrompt;
  }

  recommendTemplate(productCategory: string, goal: string): string {
    const lowerGoal = goal.toLowerCase();
    const lowerCategory = productCategory.toLowerCase();

    if (lowerGoal.includes('transform') || lowerGoal.includes('before') || lowerGoal.includes('after')) {
      return 'before-after';
    }

    if (lowerGoal.includes('review') || lowerGoal.includes('trust') || lowerGoal.includes('proof')) {
      return 'social-proof';
    }

    if (lowerGoal.includes('problem') || lowerGoal.includes('solution') || lowerGoal.includes('solve')) {
      return 'problem-solution';
    }

    if (
      lowerCategory.includes('beauty') ||
      lowerCategory.includes('fitness') ||
      lowerCategory.includes('weight')
    ) {
      return 'before-after';
    }

    logger.info('No specific template match, defaulting to problem-solution', {
      productCategory,
      goal,
    });
    return 'problem-solution';
  }
}

export const structuredPromptManager = new StructuredPromptManager();
