/*
  # Enhanced Video Generation System with VEO3, Asset Selection, and Trending Hooks

  ## Overview
  This migration adds advanced features for VEO3 Fast integration, user asset selection,
  curated trending hooks library, and robust job queue management.

  ## New Tables

  ### Asset Management
  - `product_assets` - Individual product images with quality analysis
  - `variants_assets` - Junction table linking selected assets to concepts

  ### Trending Hooks Library
  - `trending_hooks_library` - Curated 100 proven hooks with templates
  - `hook_performance` - Track hook performance metrics

  ### Job Queue System
  - `video_jobs` - Master job tracking with state machine
  - `job_beats` - Individual beat rendering tracking (4 beats per concept)

  ## Table Enhancements
  - Add selected_hook_id to variants
  - Add veo_model and beat_duration to runs
  - Add asset_selection_required to projects

  ## Security
  - RLS enabled on all new tables
  - Users can only access their own data
  - Hooks library is publicly readable
*/

-- ============================================================================
-- PRODUCT ASSETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  asset_url text NOT NULL,
  asset_type text CHECK (asset_type IN ('product', 'lifestyle', 'detail', 'unknown')) DEFAULT 'unknown',
  width integer,
  height integer,
  quality_score integer CHECK (quality_score >= 0 AND quality_score <= 100) DEFAULT 50,
  is_selected boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_assets_product_id_idx ON product_assets(product_id);
CREATE INDEX IF NOT EXISTS product_assets_is_selected_idx ON product_assets(is_selected);

ALTER TABLE product_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assets of own products"
  ON product_assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_assets.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert assets for own products"
  ON product_assets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_assets.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assets of own products"
  ON product_assets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_assets.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_assets.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete assets of own products"
  ON product_assets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_assets.product_id
      AND products.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRENDING HOOKS LIBRARY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS trending_hooks_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hook_text text NOT NULL,
  hook_type text CHECK (hook_type IN ('pov', 'question', 'before_after', 'curiosity', 'problem_solution', 'exclusive')) NOT NULL,
  hook_template text NOT NULL,
  platform text CHECK (platform IN ('tiktok', 'reels', 'both')) DEFAULT 'both',
  product_category text,
  engagement_score integer CHECK (engagement_score >= 0 AND engagement_score <= 100) DEFAULT 70,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trending_hooks_library_hook_type_idx ON trending_hooks_library(hook_type);
CREATE INDEX IF NOT EXISTS trending_hooks_library_platform_idx ON trending_hooks_library(platform);
CREATE INDEX IF NOT EXISTS trending_hooks_library_engagement_idx ON trending_hooks_library(engagement_score DESC);

ALTER TABLE trending_hooks_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hooks library is publicly readable"
  ON trending_hooks_library FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- HOOK PERFORMANCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hook_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hook_id uuid REFERENCES trending_hooks_library(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES variants(id) ON DELETE CASCADE NOT NULL,
  views integer DEFAULT 0,
  engagement_rate numeric(5,2),
  conversion_rate numeric(5,2),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hook_performance_hook_id_idx ON hook_performance(hook_id);
CREATE INDEX IF NOT EXISTS hook_performance_variant_id_idx ON hook_performance(variant_id);

ALTER TABLE hook_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hook performance of own variants"
  ON hook_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM variants
      JOIN projects ON projects.id = variants.project_id
      WHERE variants.id = hook_performance.variant_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert hook performance for own variants"
  ON hook_performance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM variants
      JOIN projects ON projects.id = variants.project_id
      WHERE variants.id = hook_performance.variant_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VIDEO JOBS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES variants(id) ON DELETE CASCADE,
  job_type text CHECK (job_type IN ('preview', 'final')) NOT NULL,
  status text CHECK (status IN (
    'pending',
    'asset_selection_required',
    'hook_selection_required',
    'generating_prompts',
    'beat_1_rendering',
    'beat_2_rendering',
    'beat_3_rendering',
    'beat_4_rendering',
    'stitching',
    'completed',
    'failed',
    'cancelled'
  )) DEFAULT 'pending',
  veo_model text DEFAULT 'veo_fast',
  total_beats integer DEFAULT 4,
  completed_beats integer DEFAULT 0,
  estimated_completion timestamptz,
  error_message text,
  credits_charged integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS video_jobs_user_id_idx ON video_jobs(user_id);
CREATE INDEX IF NOT EXISTS video_jobs_project_id_idx ON video_jobs(project_id);
CREATE INDEX IF NOT EXISTS video_jobs_variant_id_idx ON video_jobs(variant_id);
CREATE INDEX IF NOT EXISTS video_jobs_status_idx ON video_jobs(status);
CREATE INDEX IF NOT EXISTS video_jobs_created_at_idx ON video_jobs(created_at DESC);

ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video jobs"
  ON video_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video jobs"
  ON video_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video jobs"
  ON video_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- JOB BEATS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_beats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES video_jobs(id) ON DELETE CASCADE NOT NULL,
  beat_number integer CHECK (beat_number >= 1 AND beat_number <= 4) NOT NULL,
  beat_type text CHECK (beat_type IN ('hook', 'demo_1', 'demo_2', 'cta')) NOT NULL,
  status text CHECK (status IN ('pending', 'rendering', 'completed', 'failed')) DEFAULT 'pending',
  veo_prompt text,
  veo_request_json jsonb,
  veo_response_json jsonb,
  video_url text,
  duration_seconds integer DEFAULT 6,
  cost_usd numeric(10,4),
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS job_beats_job_id_idx ON job_beats(job_id);
CREATE INDEX IF NOT EXISTS job_beats_status_idx ON job_beats(status);
CREATE INDEX IF NOT EXISTS job_beats_beat_number_idx ON job_beats(beat_number);

ALTER TABLE job_beats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view beats of own jobs"
  ON job_beats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_jobs
      WHERE video_jobs.id = job_beats.job_id
      AND video_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert beats for own jobs"
  ON job_beats FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_jobs
      WHERE video_jobs.id = job_beats.job_id
      AND video_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update beats of own jobs"
  ON job_beats FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_jobs
      WHERE video_jobs.id = job_beats.job_id
      AND video_jobs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_jobs
      WHERE video_jobs.id = job_beats.job_id
      AND video_jobs.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VARIANTS ASSETS JUNCTION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS variants_assets (
  variant_id uuid REFERENCES variants(id) ON DELETE CASCADE NOT NULL,
  asset_id uuid REFERENCES product_assets(id) ON DELETE CASCADE NOT NULL,
  beat_number integer CHECK (beat_number >= 1 AND beat_number <= 4),
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (variant_id, asset_id)
);

CREATE INDEX IF NOT EXISTS variants_assets_variant_id_idx ON variants_assets(variant_id);
CREATE INDEX IF NOT EXISTS variants_assets_asset_id_idx ON variants_assets(asset_id);

ALTER TABLE variants_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view variant assets of own projects"
  ON variants_assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM variants
      JOIN projects ON projects.id = variants.project_id
      WHERE variants.id = variants_assets.variant_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert variant assets for own projects"
  ON variants_assets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM variants
      JOIN projects ON projects.id = variants.project_id
      WHERE variants.id = variants_assets.variant_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update variant assets of own projects"
  ON variants_assets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM variants
      JOIN projects ON projects.id = variants.project_id
      WHERE variants.id = variants_assets.variant_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM variants
      JOIN projects ON projects.id = variants.project_id
      WHERE variants.id = variants_assets.variant_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete variant assets of own projects"
  ON variants_assets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM variants
      JOIN projects ON projects.id = variants.project_id
      WHERE variants.id = variants_assets.variant_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- ENHANCE EXISTING TABLES
-- ============================================================================

-- Add selected_hook_id to variants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'selected_hook_id'
  ) THEN
    ALTER TABLE variants ADD COLUMN selected_hook_id uuid REFERENCES trending_hooks_library(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add hook_variables to variants for filled template data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'hook_variables'
  ) THEN
    ALTER TABLE variants ADD COLUMN hook_variables jsonb DEFAULT '{}';
  END IF;
END $$;

-- Add asset_selection_required to projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'asset_selection_required'
  ) THEN
    ALTER TABLE projects ADD COLUMN asset_selection_required boolean DEFAULT true;
  END IF;
END $$;

-- Add veo_model to runs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runs' AND column_name = 'veo_model'
  ) THEN
    ALTER TABLE runs ADD COLUMN veo_model text DEFAULT 'veo_fast';
  END IF;
END $$;

-- Add beat_duration to runs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runs' AND column_name = 'beat_duration'
  ) THEN
    ALTER TABLE runs ADD COLUMN beat_duration integer DEFAULT 6;
  END IF;
END $$;

-- ============================================================================
-- SEED TRENDING HOOKS LIBRARY (100 Curated Hooks)
-- ============================================================================

-- POV HOOKS (17 hooks)
INSERT INTO trending_hooks_library (hook_text, hook_type, hook_template, platform, engagement_score) VALUES
('POV: You just discovered {product}', 'pov', 'POV: You just discovered {product}', 'both', 95),
('POV: You finally found {benefit}', 'pov', 'POV: You finally found {benefit}', 'both', 92),
('POV: You stopped settling for {pain}', 'pov', 'POV: You stopped settling for {pain}', 'both', 88),
('POV: This changed everything about {category}', 'pov', 'POV: This changed everything about {category}', 'both', 85),
('POV: You tried {product} for the first time', 'pov', 'POV: You tried {product} for the first time', 'tiktok', 90),
('POV: Your {category} routine just got easier', 'pov', 'POV: Your {category} routine just got easier', 'both', 87),
('POV: You found the {product} everyone''s talking about', 'pov', 'POV: You found the {product} everyone''s talking about', 'both', 91),
('POV: This {product} is too good to keep secret', 'pov', 'POV: This {product} is too good to keep secret', 'reels', 89),
('POV: You stopped wasting money on {pain}', 'pov', 'POV: You stopped wasting money on {pain}', 'both', 86),
('POV: The moment you realized {benefit}', 'pov', 'POV: The moment you realized {benefit}', 'tiktok', 84),
('POV: You upgraded to {product}', 'pov', 'POV: You upgraded to {product}', 'both', 83),
('POV: Life before and after {product}', 'pov', 'POV: Life before and after {product}', 'both', 88),
('POV: You told your friend about {product}', 'pov', 'POV: You told your friend about {product}', 'tiktok', 85),
('POV: This is your sign to try {product}', 'pov', 'POV: This is your sign to try {product}', 'both', 90),
('POV: You wish you found {product} sooner', 'pov', 'POV: You wish you found {product} sooner', 'reels', 87),
('POV: Your {pain} days are over', 'pov', 'POV: Your {pain} days are over', 'both', 86),
('POV: This {product} hits different', 'pov', 'POV: This {product} hits different', 'tiktok', 84);

-- QUESTION HOOKS (17 hooks)
INSERT INTO trending_hooks_library (hook_text, hook_type, hook_template, platform, engagement_score) VALUES
('Why is everyone obsessed with {product}?', 'question', 'Why is everyone obsessed with {product}?', 'both', 94),
('What if {benefit} was this easy?', 'question', 'What if {benefit} was this easy?', 'both', 91),
('How do {audience} get {result}?', 'question', 'How do {audience} get {result}?', 'both', 88),
('Is this the secret to {benefit}?', 'question', 'Is this the secret to {benefit}?', 'both', 89),
('Why didn''t anyone tell me about {product}?', 'question', 'Why didn''t anyone tell me about {product}?', 'tiktok', 92),
('What''s the deal with {product}?', 'question', 'What''s the deal with {product}?', 'both', 85),
('Can {product} really solve {pain}?', 'question', 'Can {product} really solve {pain}?', 'both', 87),
('Is {product} worth the hype?', 'question', 'Is {product} worth the hype?', 'reels', 90),
('How does {product} actually work?', 'question', 'How does {product} actually work?', 'both', 86),
('Why is {product} better than {alternative}?', 'question', 'Why is {product} better than {alternative}?', 'both', 88),
('What makes {product} different?', 'question', 'What makes {product} different?', 'both', 84),
('Should you try {product}?', 'question', 'Should you try {product}?', 'both', 83),
('Have you heard about {product}?', 'question', 'Have you heard about {product}?', 'tiktok', 85),
('What if you could {benefit}?', 'question', 'What if you could {benefit}?', 'both', 87),
('Why are people switching to {product}?', 'question', 'Why are people switching to {product}?', 'reels', 89),
('Is this the solution to {pain}?', 'question', 'Is this the solution to {pain}?', 'both', 86),
('What happened when I tried {product}?', 'question', 'What happened when I tried {product}?', 'tiktok', 88);

-- BEFORE-AFTER HOOKS (17 hooks)
INSERT INTO trending_hooks_library (hook_text, hook_type, hook_template, platform, engagement_score) VALUES
('From {pain} to {gain} in {timeframe}', 'before_after', 'From {pain} to {gain} in {timeframe}', 'both', 96),
('Before: {pain}. After: {gain}', 'before_after', 'Before: {pain}. After: {gain}', 'both', 93),
('Stop {pain}, start {benefit}', 'before_after', 'Stop {pain}, start {benefit}', 'both', 90),
('{pain} vs. {benefit} with {product}', 'before_after', '{pain} vs. {benefit} with {product}', 'both', 89),
('Life before {product} vs. after', 'before_after', 'Life before {product} vs. after', 'reels', 91),
('The transformation is real: {product}', 'before_after', 'The transformation is real: {product}', 'both', 87),
('How {product} changed my {category} game', 'before_after', 'How {product} changed my {category} game', 'tiktok', 88),
('I used to {pain}, now I {benefit}', 'before_after', 'I used to {pain}, now I {benefit}', 'both', 85),
('Before {product}: {pain}. After {product}: {gain}', 'before_after', 'Before {product}: {pain}. After {product}: {gain}', 'both', 92),
('The {product} glow up is real', 'before_after', 'The {product} glow up is real', 'reels', 86),
('From struggling with {pain} to {benefit}', 'before_after', 'From struggling with {pain} to {benefit}', 'both', 89),
('Watch this transformation with {product}', 'before_after', 'Watch this transformation with {product}', 'both', 84),
('My {category} before and after {product}', 'before_after', 'My {category} before and after {product}', 'tiktok', 87),
('This is what {product} did for me', 'before_after', 'This is what {product} did for me', 'both', 88),
('Say goodbye to {pain} forever', 'before_after', 'Say goodbye to {pain} forever', 'reels', 85),
('The difference {product} makes', 'before_after', 'The difference {product} makes', 'both', 86),
('Here''s what changed when I got {product}', 'before_after', 'Here''s what changed when I got {product}', 'tiktok', 84);

-- CURIOSITY HOOKS (17 hooks)
INSERT INTO trending_hooks_library (hook_text, hook_type, hook_template, platform, engagement_score) VALUES
('You won''t believe this about {product}', 'curiosity', 'You won''t believe this about {product}', 'both', 94),
('This {product} secret will change everything', 'curiosity', 'This {product} secret will change everything', 'both', 91),
('I can''t believe I didn''t know about {product}', 'curiosity', 'I can''t believe I didn''t know about {product}', 'tiktok', 89),
('The truth about {product} that nobody tells you', 'curiosity', 'The truth about {product} that nobody tells you', 'both', 92),
('Wait until you see what {product} can do', 'curiosity', 'Wait until you see what {product} can do', 'both', 87),
('This is the {product} hack you need', 'curiosity', 'This is the {product} hack you need', 'reels', 88),
('Nobody talks about this feature of {product}', 'curiosity', 'Nobody talks about this feature of {product}', 'both', 86),
('The {product} feature that shocked me', 'curiosity', 'The {product} feature that shocked me', 'tiktok', 85),
('You''re using {product} wrong (here''s how)', 'curiosity', 'You''re using {product} wrong (here''s how)', 'both', 90),
('I tested {product} for {timeframe}. Results?', 'curiosity', 'I tested {product} for {timeframe}. Results?', 'both', 89),
('The {product} detail that changes everything', 'curiosity', 'The {product} detail that changes everything', 'reels', 84),
('Stop scrolling. You need to see {product}', 'curiosity', 'Stop scrolling. You need to see {product}', 'tiktok', 91),
('This {product} went viral for a reason', 'curiosity', 'This {product} went viral for a reason', 'both', 87),
('The hidden benefit of {product}', 'curiosity', 'The hidden benefit of {product}', 'both', 85),
('I finally understand why {product} is trending', 'curiosity', 'I finally understand why {product} is trending', 'reels', 88),
('The one thing about {product} you must know', 'curiosity', 'The one thing about {product} you must know', 'both', 86),
('This changes everything about {category}', 'curiosity', 'This changes everything about {category}', 'tiktok', 83);

-- PROBLEM-SOLUTION HOOKS (16 hooks)
INSERT INTO trending_hooks_library (hook_text, hook_type, hook_template, platform, engagement_score) VALUES
('Tired of {pain}? Try {product}', 'problem_solution', 'Tired of {pain}? Try {product}', 'both', 93),
('Struggling with {pain}? Here''s the solution', 'problem_solution', 'Struggling with {pain}? Here''s the solution', 'both', 90),
('If you have {pain}, you need {product}', 'problem_solution', 'If you have {pain}, you need {product}', 'both', 88),
('Say goodbye to {pain} with {product}', 'problem_solution', 'Say goodbye to {pain} with {product}', 'reels', 89),
('Finally, a solution to {pain}', 'problem_solution', 'Finally, a solution to {pain}', 'both', 87),
('Stop dealing with {pain}', 'problem_solution', 'Stop dealing with {pain}', 'tiktok', 85),
('Fix your {pain} problem in {timeframe}', 'problem_solution', 'Fix your {pain} problem in {timeframe}', 'both', 91),
('The answer to {pain} is here', 'problem_solution', 'The answer to {pain} is here', 'both', 84),
('{pain} ruining your day? Not anymore', 'problem_solution', '{pain} ruining your day? Not anymore', 'reels', 86),
('I solved {pain} with this', 'problem_solution', 'I solved {pain} with this', 'tiktok', 88),
('No more {pain}. Just {benefit}', 'problem_solution', 'No more {pain}. Just {benefit}', 'both', 89),
('This fixes {pain} instantly', 'problem_solution', 'This fixes {pain} instantly', 'both', 87),
('Done with {pain}? Try this', 'problem_solution', 'Done with {pain}? Try this', 'reels', 85),
('The end of {pain} starts here', 'problem_solution', 'The end of {pain} starts here', 'both', 83),
('Your {pain} solution is {product}', 'problem_solution', 'Your {pain} solution is {product}', 'tiktok', 86),
('This eliminates {pain} completely', 'problem_solution', 'This eliminates {pain} completely', 'both', 88);

-- EXCLUSIVE HOOKS (16 hooks)
INSERT INTO trending_hooks_library (hook_text, hook_type, hook_template, platform, engagement_score) VALUES
('Only 1% know this {product} trick', 'exclusive', 'Only 1% know this {product} trick', 'both', 92),
('The {product} secret pros use', 'exclusive', 'The {product} secret pros use', 'both', 89),
('Insiders know: {product} is the key', 'exclusive', 'Insiders know: {product} is the key', 'reels', 87),
('The {product} hack nobody shares', 'exclusive', 'The {product} hack nobody shares', 'tiktok', 90),
('Top {audience} swear by {product}', 'exclusive', 'Top {audience} swear by {product}', 'both', 86),
('The secret to {benefit}? {product}', 'exclusive', 'The secret to {benefit}? {product}', 'both', 88),
('Elite {audience} use {product}', 'exclusive', 'Elite {audience} use {product}', 'reels', 84),
('This is what {audience} don''t tell you', 'exclusive', 'This is what {audience} don''t tell you', 'tiktok', 91),
('The {product} method that works', 'exclusive', 'The {product} method that works', 'both', 85),
('Premium {category} starts with {product}', 'exclusive', 'Premium {category} starts with {product}', 'both', 83),
('The {product} everyone wants', 'exclusive', 'The {product} everyone wants', 'reels', 87),
('Exclusive: The real way to use {product}', 'exclusive', 'Exclusive: The real way to use {product}', 'tiktok', 89),
('This is the {product} upgrade you need', 'exclusive', 'This is the {product} upgrade you need', 'both', 86),
('Smart {audience} choose {product}', 'exclusive', 'Smart {audience} choose {product}', 'both', 84),
('The premium choice for {category}', 'exclusive', 'The premium choice for {category}', 'reels', 82),
('What top {audience} know about {product}', 'exclusive', 'What top {audience} know about {product}', 'tiktok', 88);
