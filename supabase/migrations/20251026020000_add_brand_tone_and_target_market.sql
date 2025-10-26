/*
  # Add Brand Tone and Target Market Support

  ## Summary
  This migration adds support for brand tone prompts and target market selection to enable
  intelligent prompt compilation with regional targeting.

  ## Changes Made

  ### Brand Kits Table Updates
  - Add `brand_tone_prompt` column to store custom brand personality/style descriptions
  - Add `target_market` column to specify regional targeting (India, USA, Middle East, Europe, Global)

  ### Variants Table Updates
  - Add `creation_mode` column to track whether concept was automated or manual
  - Add `manual_prompt` column to store user's original manual prompt if applicable

  ## Notes
  - These fields enable the intelligent prompt compiler to:
    1. Inject brand personality into VEO3 prompts
    2. Apply regional character/setting customizations
    3. Support both automated (hook-based) and manual (free-text) creation modes
*/

-- Add brand tone and target market to brand_kits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brand_kits' AND column_name = 'brand_tone_prompt'
  ) THEN
    ALTER TABLE brand_kits ADD COLUMN brand_tone_prompt text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brand_kits' AND column_name = 'target_market'
  ) THEN
    ALTER TABLE brand_kits ADD COLUMN target_market text DEFAULT 'Global' CHECK (target_market IN ('India', 'USA', 'Middle East', 'Europe', 'Global'));
  END IF;
END $$;

-- Add creation mode and manual prompt tracking to variants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'creation_mode'
  ) THEN
    ALTER TABLE variants ADD COLUMN creation_mode text DEFAULT 'automated' CHECK (creation_mode IN ('automated', 'manual'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'manual_prompt'
  ) THEN
    ALTER TABLE variants ADD COLUMN manual_prompt text;
  END IF;
END $$;

-- Create index on target_market for efficient filtering
CREATE INDEX IF NOT EXISTS brand_kits_target_market_idx ON brand_kits(target_market);

-- Create index on creation_mode for analytics
CREATE INDEX IF NOT EXISTS variants_creation_mode_idx ON variants(creation_mode);
