/*
  # Add Project-Product Relationship

  ## Changes
  - Add `product_id` column to `projects` table to link projects with products
  - Add `brand_kit_id` column to `projects` table to link projects with brand kits
  - These allow the plan route to easily fetch product and brand kit data for a project

  ## Notes
  - Existing projects without products will have NULL product_id (acceptable)
  - This creates a cleaner data model where projects reference their associated resources
*/

-- Add product_id and brand_kit_id to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN product_id uuid REFERENCES products(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'brand_kit_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN brand_kit_id uuid REFERENCES brand_kits(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS projects_product_id_idx ON projects(product_id);
CREATE INDEX IF NOT EXISTS projects_brand_kit_id_idx ON projects(brand_kit_id);
