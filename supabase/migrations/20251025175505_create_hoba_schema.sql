/*
  # HOBA - Shopify Ad Video Engine Database Schema

  ## Overview
  This migration creates the complete database schema for HOBA, a platform that generates
  trend-smart story ads from product URLs. The system supports two workflows:
  1. Product URL workflow: ingest → plan → render
  2. Custom prompt workflow: prompt → render

  ## Tables Created

  ### Core Tables
  - `users` - User accounts with credit balance
  - `projects` - Product-based video generation projects
  - `variants` - Individual video concepts (A, B, C variants per project)
  - `runs` - Video rendering job tracking
  - `assets` - Project branding assets (logos, colors, images)

  ### Trend Intelligence
  - `trend_hooks` - Trending hooks from Meta EU and TikTok Center

  ### Custom Prompt Workflow
  - `custom_prompts` - User-created free-text video prompts
  - `prompt_runs` - Rendering jobs for custom prompts
  - `prompt_templates` - Reusable prompt templates

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies restrict access to authenticated users' own data
  - Trend hooks and templates are publicly readable

  ## Notes
  - Credits system: previews are free, finals cost 3 credits per set
  - Default credit allocation: 50 credits per user
  - Video engine options: 'veo_fast' (previews) | 'veo_3_x' (finals)
  - Aspect ratios optimized for social: 9:16 (TikTok, Reels, Shorts)
*/

-- users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  credits int NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile during signup"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  shop_url text NOT NULL,
  title text,
  vertical text,
  status text CHECK (status IN ('draft', 'rendering', 'done', 'error')) DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- variants table
CREATE TABLE IF NOT EXISTS variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  concept_tag text CHECK (concept_tag IN ('A', 'B', 'C')),
  hook text,
  script_json jsonb,
  aspect text DEFAULT '9:16',
  seed int,
  status text CHECK (status IN ('planned', 'previewing', 'finalizing', 'done', 'error')) DEFAULT 'planned',
  video_url text,
  srt_url text
);

ALTER TABLE variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view variants of own projects"
  ON variants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = variants.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create variants for own projects"
  ON variants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = variants.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update variants of own projects"
  ON variants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = variants.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = variants.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete variants of own projects"
  ON variants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = variants.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- runs table
CREATE TABLE IF NOT EXISTS runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid REFERENCES variants(id) ON DELETE CASCADE,
  engine text,
  state text CHECK (state IN ('queued', 'running', 'succeeded', 'failed')) DEFAULT 'queued',
  cost_seconds int,
  request_json jsonb,
  response_json jsonb,
  error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view runs of own variants"
  ON runs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM variants
      JOIN projects ON projects.id = variants.project_id
      WHERE variants.id = runs.variant_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create runs for own variants"
  ON runs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM variants
      JOIN projects ON projects.id = variants.project_id
      WHERE variants.id = runs.variant_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update runs of own variants"
  ON runs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM variants
      JOIN projects ON projects.id = variants.project_id
      WHERE variants.id = runs.variant_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM variants
      JOIN projects ON projects.id = variants.project_id
      WHERE variants.id = runs.variant_id
      AND projects.user_id = auth.uid()
    )
  );

-- trend_hooks table
CREATE TABLE IF NOT EXISTS trend_hooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  vertical text,
  template text,
  example text,
  source text,
  freq int DEFAULT 1
);

CREATE INDEX IF NOT EXISTS trend_hooks_date_idx ON trend_hooks(date);

ALTER TABLE trend_hooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trend hooks are publicly readable"
  ON trend_hooks FOR SELECT
  TO authenticated
  USING (true);

-- assets table
CREATE TABLE IF NOT EXISTS assets (
  project_id uuid PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  logo_svg text,
  palette_json jsonb,
  images text[]
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assets of own projects"
  ON assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create assets for own projects"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assets of own projects"
  ON assets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = assets.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete assets of own projects"
  ON assets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = assets.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- custom_prompts table
CREATE TABLE IF NOT EXISTS custom_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text,
  aspect text DEFAULT '9:16',
  duration_seconds int DEFAULT 20,
  tone text,
  hook_template text,
  seed int,
  script_json jsonb,
  voice_json jsonb,
  assets_json jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom prompts"
  ON custom_prompts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own custom prompts"
  ON custom_prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom prompts"
  ON custom_prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom prompts"
  ON custom_prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- prompt_runs table
CREATE TABLE IF NOT EXISTS prompt_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid REFERENCES custom_prompts(id) ON DELETE CASCADE,
  engine text,
  state text CHECK (state IN ('queued', 'running', 'succeeded', 'failed')) DEFAULT 'queued',
  cost_seconds int,
  request_json jsonb,
  response_json jsonb,
  error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prompt_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view runs of own prompts"
  ON prompt_runs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_prompts
      WHERE custom_prompts.id = prompt_runs.prompt_id
      AND custom_prompts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create runs for own prompts"
  ON prompt_runs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_prompts
      WHERE custom_prompts.id = prompt_runs.prompt_id
      AND custom_prompts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update runs of own prompts"
  ON prompt_runs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_prompts
      WHERE custom_prompts.id = prompt_runs.prompt_id
      AND custom_prompts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_prompts
      WHERE custom_prompts.id = prompt_runs.prompt_id
      AND custom_prompts.user_id = auth.uid()
    )
  );

-- prompt_templates table
CREATE TABLE IF NOT EXISTS prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  template_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prompt templates are publicly readable"
  ON prompt_templates FOR SELECT
  TO authenticated
  USING (true);
