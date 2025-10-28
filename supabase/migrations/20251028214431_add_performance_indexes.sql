/*
  # Add Performance Indexes

  1. Indexes Added
    - `projects_user_id_idx` on projects(user_id) for faster Library queries
    - `projects_created_at_idx` on projects(created_at DESC) for sorting
    - `projects_user_created_idx` on projects(user_id, created_at DESC) for combined queries
    - `products_user_id_idx` on products(user_id) for faster product lookups
    - `brand_kits_user_id_idx` on brand_kits(user_id) for faster brand kit queries
    - `variants_project_id_idx` on variants(project_id) for faster variant lookups
    
  2. Purpose
    - Dramatically improve query performance for user-specific data
    - Speed up Library page load times
    - Optimize dashboard and data retrieval operations
*/

-- Projects table indexes
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS projects_user_created_idx ON projects(user_id, created_at DESC);

-- Products table indexes
CREATE INDEX IF NOT EXISTS products_user_id_idx ON products(user_id);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products(created_at DESC);

-- Brand kits table indexes
CREATE INDEX IF NOT EXISTS brand_kits_user_id_idx ON brand_kits(user_id);
CREATE INDEX IF NOT EXISTS brand_kits_product_id_idx ON brand_kits(product_id);

-- Variants table indexes
CREATE INDEX IF NOT EXISTS variants_project_id_idx ON variants(project_id);
CREATE INDEX IF NOT EXISTS variants_status_idx ON variants(status);
