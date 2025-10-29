/*
  # Create video_configs table for video configuration flow
  
  1. New Tables
    - `video_configs`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, foreign key to users)
      - `messaging_type` (text) - hooks/templates/manual
      - `selected_hook` (text, optional) - if messaging_type is hooks
      - `selected_template` (text, optional) - if messaging_type is templates
      - `manual_prompt` (text, optional) - if messaging_type is manual
      - `target_audience` (jsonb) - demographics data
      - `key_selling_points` (text[]) - array of selling points
      - `technical_specs` (text, optional)
      - `cta_text` (text) - call-to-action text
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `video_configs` table
    - Add policies for users to manage their own video configs
  
  3. Indexes
    - Add index on project_id for fast lookups
    - Add index on user_id for user-specific queries
*/

-- Create video_configs table
CREATE TABLE IF NOT EXISTS video_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  messaging_type text NOT NULL CHECK (messaging_type IN ('hooks', 'templates', 'manual')),
  selected_hook text,
  selected_template text,
  manual_prompt text,
  target_audience jsonb DEFAULT '{}',
  key_selling_points text[] DEFAULT '{}',
  technical_specs text,
  cta_text text DEFAULT 'Shop Now',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE video_configs ENABLE ROW LEVEL SECURITY;

-- Policies for video_configs
CREATE POLICY "Users can view own video configs"
  ON video_configs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video configs"
  ON video_configs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video configs"
  ON video_configs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own video configs"
  ON video_configs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can manage all video configs"
  ON video_configs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_configs_project_id ON video_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_video_configs_user_id ON video_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_configs_created_at ON video_configs(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_video_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_configs_updated_at
  BEFORE UPDATE ON video_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_video_configs_updated_at();
