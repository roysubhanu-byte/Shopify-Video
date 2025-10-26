/*
  # Add trend_hooks table for hook templates

  1. New Tables
    - `trend_hooks`
      - `id` (uuid, primary key)
      - `template` (text) - Hook template pattern (POV, Question, Before/After, etc.)
      - `example` (text) - Example hook text
      - `vertical` (text) - Product vertical/category (pets, beauty, fitness, etc.)
      - `performance` (float) - Performance score for ranking (default 0.5)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `trend_hooks` table
    - Add policy for authenticated users to read hooks
    - Add policy for service role to insert/update hooks

  3. Seed Data
    - Insert 20 trending hook templates across various verticals
*/

CREATE TABLE IF NOT EXISTS trend_hooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template text NOT NULL,
  example text NOT NULL,
  vertical text DEFAULT 'general',
  performance real DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trend_hooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read trend hooks"
  ON trend_hooks
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert trend hooks"
  ON trend_hooks
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update trend hooks"
  ON trend_hooks
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_trend_hooks_vertical ON trend_hooks(vertical);
CREATE INDEX IF NOT EXISTS idx_trend_hooks_performance ON trend_hooks(performance DESC);

INSERT INTO trend_hooks (template, example, vertical, performance) VALUES
  ('POV', 'POV: You finally found the perfect gift', 'general', 0.85),
  ('POV', 'POV: Messy walks are finally over', 'pets', 0.90),
  ('POV', 'POV: Your skincare routine got an upgrade', 'beauty', 0.88),
  ('POV', 'POV: Cooking just became your favorite hobby', 'kitchen', 0.82),
  ('Question', 'What if your dog walked you?', 'pets', 0.87),
  ('Question', 'What if mornings were actually easy?', 'lifestyle', 0.91),
  ('Question', 'What if workouts felt like fun?', 'fitness', 0.84),
  ('Question', 'What if dinner made itself?', 'kitchen', 0.79),
  ('Before/After', 'Before: chaos - After: calm', 'general', 0.93),
  ('Before/After', 'Before: tangled - After: smooth', 'beauty', 0.89),
  ('Before/After', 'Before: stressed - After: zen', 'wellness', 0.86),
  ('Before/After', 'Before: messy - After: organized', 'home', 0.81),
  ('Did you know', 'Did you know 80% of people skip this step?', 'general', 0.77),
  ('Did you know', 'Did you know your pet could be healthier?', 'pets', 0.83),
  ('Stop doing', 'Stop wasting money on products that don't work', 'general', 0.80),
  ('Stop doing', 'Stop struggling with morning routines', 'lifestyle', 0.78),
  ('This is your sign', 'This is your sign to try something new', 'general', 0.75),
  ('This is your sign', 'This is your sign to upgrade your routine', 'lifestyle', 0.76),
  ('Nobody talks about', 'Nobody talks about how easy this actually is', 'general', 0.72),
  ('The secret to', 'The secret to flawless skin? It's simpler than you think', 'beauty', 0.88),
  ('The secret to', 'The secret to happy pets? Better nutrition', 'pets', 0.85),
  ('If you struggle with', 'If you struggle with sleep, watch this', 'wellness', 0.82),
  ('If you struggle with', 'If you struggle with pet hair, this changes everything', 'pets', 0.79),
  ('You need to see', 'You need to see how this product performs', 'general', 0.74),
  ('Everyone is obsessed with', 'Everyone is obsessed with this simple hack', 'lifestyle', 0.81)
ON CONFLICT DO NOTHING;
