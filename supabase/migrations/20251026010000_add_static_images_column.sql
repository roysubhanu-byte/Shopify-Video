/*
  # Add static_image_urls column to variants table

  1. Changes
    - Add `static_image_urls` (text[]) to variants table for storing generated PNG URLs
    - Allows storing multiple static image variants per video variant

  2. Notes
    - No RLS changes needed - uses existing policies
    - Array allows storing 3 static image URLs (top, center, bottom positions)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'static_image_urls'
  ) THEN
    ALTER TABLE variants ADD COLUMN static_image_urls text[];
  END IF;
END $$;
