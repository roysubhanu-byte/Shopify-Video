/*
  # Add Product Assets Performance Indexes

  1. New Indexes
    - `product_assets_product_id_idx` on product_assets(product_id) for faster asset lookups
    - `product_assets_selected_idx` on product_assets(product_id, is_selected) for filtering selected assets
    - `product_assets_display_order_idx` on product_assets(product_id, is_selected, display_order) for ordered queries
    - `runs_variant_id_idx` on runs(variant_id) for faster render status lookups
    - `runs_state_idx` on runs(state) for filtering by render state
    - `runs_created_at_idx` on runs(created_at DESC) for sorting by recency

  2. Purpose
    - Dramatically improve asset selection and verification queries
    - Speed up render status polling
    - Optimize asset ordering and display
    - Reduce database query time from seconds to milliseconds

  3. Important Notes
    - These indexes target the most frequent query patterns in the application
    - Composite indexes are ordered for maximum efficiency
    - All indexes use IF NOT EXISTS to allow safe re-running
*/

-- Product assets table indexes for faster asset queries
CREATE INDEX IF NOT EXISTS product_assets_product_id_idx
  ON product_assets(product_id);

CREATE INDEX IF NOT EXISTS product_assets_selected_idx
  ON product_assets(product_id, is_selected);

CREATE INDEX IF NOT EXISTS product_assets_display_order_idx
  ON product_assets(product_id, is_selected, display_order);

CREATE INDEX IF NOT EXISTS product_assets_type_idx
  ON product_assets(product_id, asset_type);

-- Runs table indexes for faster render status queries
CREATE INDEX IF NOT EXISTS runs_variant_id_idx
  ON runs(variant_id);

CREATE INDEX IF NOT EXISTS runs_state_idx
  ON runs(state);

CREATE INDEX IF NOT EXISTS runs_created_at_idx
  ON runs(created_at DESC);

CREATE INDEX IF NOT EXISTS runs_variant_state_idx
  ON runs(variant_id, state);

-- Projects table additional indexes for product and brand kit relationships
CREATE INDEX IF NOT EXISTS projects_product_id_idx
  ON projects(product_id);

CREATE INDEX IF NOT EXISTS projects_brand_kit_id_idx
  ON projects(brand_kit_id);
