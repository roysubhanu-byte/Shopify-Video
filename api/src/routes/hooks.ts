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
  { template: 'POV', example: 'POV: You finally found the perfect gift', vertical: 'general', performance: 0.85 },
  { template: 'POV', example: 'POV: Messy walks are finally over', vertical: 'pets', performance: 0.90 },
  { template: 'POV', example: 'POV: Your skincare routine got an upgrade', vertical: 'beauty', performance: 0.88 },
  { template: 'POV', example: 'POV: Cooking just became your favorite hobby', vertical: 'kitchen', performance: 0.82 },
  { template: 'POV', example: 'POV: Your morning routine is about to change forever', vertical: 'lifestyle', performance: 0.86 },
  { template: 'Question', example: 'What if your dog walked you?', vertical: 'pets', performance: 0.87 },
  { template: 'Question', example: 'What if mornings were actually easy?', vertical: 'lifestyle', performance: 0.91 },
  { template: 'Question', example: 'What if workouts felt like fun?', vertical: 'fitness', performance: 0.84 },
  { template: 'Question', example: 'What if dinner made itself?', vertical: 'kitchen', performance: 0.79 },
  { template: 'Question', example: 'What if you could sleep better tonight?', vertical: 'wellness', performance: 0.88 },
  { template: 'Before/After', example: 'Before: chaos - After: calm', vertical: 'general', performance: 0.93 },
  { template: 'Before/After', example: 'Before: tangled - After: smooth', vertical: 'beauty', performance: 0.89 },
  { template: 'Before/After', example: 'Before: stressed - After: zen', vertical: 'wellness', performance: 0.86 },
  { template: 'Before/After', example: 'Before: messy - After: organized', vertical: 'home', performance: 0.81 },
  { template: 'Before/After', example: 'Before: tired - After: energized', vertical: 'fitness', performance: 0.85 },
  { template: 'Did you know', example: 'Did you know 80% of people skip this step?', vertical: 'general', performance: 0.77 },
  { template: 'Did you know', example: 'Did you know your pet could be healthier?', vertical: 'pets', performance: 0.83 },
  { template: 'Did you know', example: 'Did you know this trick saves hours every week?', vertical: 'lifestyle', performance: 0.80 },
  { template: 'Stop doing', example: 'Stop wasting money on products that don\'t work', vertical: 'general', performance: 0.80 },
  { template: 'Stop doing', example: 'Stop struggling with morning routines', vertical: 'lifestyle', performance: 0.78 },
  { template: 'Stop doing', example: 'Stop ignoring these warning signs', vertical: 'wellness', performance: 0.82 },
  { template: 'This is your sign', example: 'This is your sign to try something new', vertical: 'general', performance: 0.75 },
  { template: 'This is your sign', example: 'This is your sign to upgrade your routine', vertical: 'lifestyle', performance: 0.76 },
  { template: 'This is your sign', example: 'This is your sign to prioritize yourself', vertical: 'wellness', performance: 0.79 },
  { template: 'Nobody talks about', example: 'Nobody talks about how easy this actually is', vertical: 'general', performance: 0.72 },
  { template: 'Nobody talks about', example: 'Nobody talks about this game-changing feature', vertical: 'tech', performance: 0.74 },
  { template: 'The secret to', example: 'The secret to flawless skin? Simpler than you think', vertical: 'beauty', performance: 0.88 },
  { template: 'The secret to', example: 'The secret to happy pets? Better nutrition', vertical: 'pets', performance: 0.85 },
  { template: 'The secret to', example: 'The secret to perfect meals? This one tool', vertical: 'kitchen', performance: 0.81 },
  { template: 'If you struggle with', example: 'If you struggle with sleep, watch this', vertical: 'wellness', performance: 0.82 },
  { template: 'If you struggle with', example: 'If you struggle with pet hair, this changes everything', vertical: 'pets', performance: 0.79 },
  { template: 'If you struggle with', example: 'If you struggle with clutter, you need this', vertical: 'home', performance: 0.77 },
  { template: 'You need to see', example: 'You need to see how this product performs', vertical: 'general', performance: 0.74 },
  { template: 'You need to see', example: 'You need to see what everyone is raving about', vertical: 'lifestyle', performance: 0.76 },
  { template: 'Everyone is obsessed with', example: 'Everyone is obsessed with this simple hack', vertical: 'lifestyle', performance: 0.81 },
  { template: 'Everyone is obsessed with', example: 'Everyone is obsessed with this new product', vertical: 'general', performance: 0.78 },
];

async function ensureHooksSeeded(): Promise<void> {
  try {
    const { count, error: countError } = await supabase
      .from('trend_hooks')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      logger.error('Failed to count hooks', { error: countError });
      return;
    }

    if (!count || count < 25) {
      logger.info('Seeding hooks into database', { currentCount: count });

      const hooksToInsert = SEEDED_HOOKS.map(h => ({
        template: h.template,
        example: h.example,
        vertical: h.vertical || 'general',
        freq: Math.floor((h.performance || 0.5) * 100),
        date: new Date().toISOString().split('T')[0],
        source: 'seeded',
      }));

      const { error: insertError } = await supabase
        .from('trend_hooks')
        .upsert(hooksToInsert, { onConflict: 'template,example' });

      if (insertError) {
        logger.error('Failed to seed hooks', { error: insertError });
      } else {
        logger.info('Hooks seeded successfully', { count: hooksToInsert.length });
      }
    }
  } catch (error) {
    logger.error('Error ensuring hooks seeded', { error });
  }
}

async function getHooksFromDatabase(vertical?: string, limit: number = 20): Promise<TrendHook[]> {
  try {
    await ensureHooksSeeded();

    logger.info('Fetching hooks from database', { vertical, limit });

    let query = supabase
      .from('trend_hooks')
      .select('template, example, vertical, freq')
      .order('freq', { ascending: false })
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
      performance: (row.freq || 50) / 100,
    }));

  } catch (error) {
    logger.error('Database hooks error', { error });
    return [];
  }
}

function getSeededHooks(vertical?: string, limit: number = 20): TrendHook[] {
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

    const limitNum = limit ? Math.min(Math.max(parseInt(limit as string, 10), 1), 50) : 20;

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
