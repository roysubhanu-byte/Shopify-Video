import { Router } from 'express';
import { Logger } from '../lib/logger';
import { supabase } from '../lib/supabase';

const router = Router();
const logger = new Logger({ module: 'hooks-route' });

interface TrendHook {
  template: string;
  example: string;
  vertical?: string;
  performance?: number;
}

const SEEDED_HOOKS: TrendHook[] = [
  { template: 'POV', example: 'POV: You finally found the perfect gift', vertical: 'general' },
  { template: 'POV', example: 'POV: Messy walks are finally over', vertical: 'pets' },
  { template: 'POV', example: 'POV: Your skincare routine got an upgrade', vertical: 'beauty' },
  { template: 'Question', example: 'What if your dog walked you?', vertical: 'pets' },
  { template: 'Question', example: 'What if mornings were actually easy?', vertical: 'lifestyle' },
  { template: 'Question', example: 'What if workouts felt like fun?', vertical: 'fitness' },
  { template: 'Before/After', example: 'Before: chaos - After: calm', vertical: 'general' },
  { template: 'Before/After', example: 'Before: tangled - After: smooth', vertical: 'beauty' },
  { template: 'Before/After', example: 'Before: stressed - After: zen', vertical: 'wellness' },
  { template: 'Did you know', example: 'Did you know 80% of people skip this step?', vertical: 'general' },
  { template: 'Did you know', example: 'Did you know your pet could be healthier?', vertical: 'pets' },
  { template: 'Stop doing', example: 'Stop wasting money on products that do not work', vertical: 'general' },
  { template: 'Stop doing', example: 'Stop struggling with morning routines', vertical: 'lifestyle' },
  { template: 'This is your sign', example: 'This is your sign to try something new', vertical: 'general' },
  { template: 'This is your sign', example: 'This is your sign to upgrade your routine', vertical: 'lifestyle' },
  { template: 'Nobody talks about', example: 'Nobody talks about how easy this actually is', vertical: 'general' },
  { template: 'The secret to', example: 'The secret to flawless skin? Simpler than you think', vertical: 'beauty' },
  { template: 'The secret to', example: 'The secret to happy pets? Better nutrition', vertical: 'pets' },
  { template: 'If you struggle with', example: 'If you struggle with sleep, watch this', vertical: 'wellness' },
  { template: 'If you struggle with', example: 'If you struggle with pet hair, this changes everything', vertical: 'pets' },
];

async function getHooksFromDatabase(vertical?: string, limit: number = 10): Promise<TrendHook[]> {
  try {
    logger.info('Fetching hooks from database', { vertical, limit });

    let query = supabase
      .from('trend_hooks')
      .select('template, example, vertical, performance')
      .order('performance', { ascending: false })
      .limit(limit);

    if (vertical && vertical !== 'general') {
      query = query.or(`vertical.eq.${vertical},vertical.eq.general`);
    }

    const { data, error } = await query;

    if (error) {
      logger.warn('Database hooks query failed', { error });
      return [];
    }

    if (!data || data.length === 0) {
      logger.info('No hooks found in database');
      return [];
    }

    logger.info('Database hooks fetched', { count: data.length });

    return data.map((row: any) => ({
      template: row.template,
      example: row.example,
      vertical: row.vertical,
      performance: row.performance,
    }));

  } catch (error) {
    logger.error('Database hooks error', { error });
    return [];
  }
}

function getSeededHooks(vertical?: string, limit: number = 10): TrendHook[] {
  let filtered = SEEDED_HOOKS;

  if (vertical && vertical !== 'general') {
    filtered = SEEDED_HOOKS.filter(
      (h) => h.vertical === vertical || h.vertical === 'general'
    );
  }

  const shuffled = [...filtered].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, limit);
}

router.get('/api/hooks', async (req, res) => {
  try {
    const { vertical, limit } = req.query;

    const limitNum = limit ? Math.min(Math.max(parseInt(limit as string, 10), 1), 50) : 10;

    logger.info('Hooks request', { vertical, limit: limitNum });

    let hooks = await getHooksFromDatabase(vertical as string | undefined, limitNum);

    if (hooks.length === 0) {
      logger.info('Using seeded hooks as fallback');
      hooks = getSeededHooks(vertical as string | undefined, limitNum);
    }

    res.json({
      success: true,
      vertical: vertical || 'all',
      count: hooks.length,
      hooks,
    });

  } catch (error) {
    logger.error('Hooks endpoint error', { error });
    res.status(500).json({
      error: 'Failed to fetch hooks',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
