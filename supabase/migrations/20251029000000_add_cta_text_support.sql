/*
  # Add CTA Text Support

  ## Summary
  This migration adds support for storing CTA (Call-to-Action) text selections
  in the video generation plans. The CTA text is stored within the beat's JSON
  structure in the script_json column of the variants table.

  ## Changes
  - No schema changes needed - CTA text is stored in existing JSONB script_json column
  - This migration serves as documentation that beats now support a ctaText field
  - The ctaText field can be one of: 'Learn More', 'Buy Now', 'Shop Now', 'Order Now', 'Get Yours', 'Limited Time'

  ## Notes
  The script_json column in the variants table already supports arbitrary JSON,
  so no ALTER TABLE statements are needed. This migration exists for:
  1. Documentation purposes
  2. Version tracking
  3. Ensuring migration consistency across environments
*/

-- No actual schema changes needed
-- The script_json JSONB column already supports the ctaText field in beat objects

SELECT 1; -- Placeholder to ensure migration runs
