/*
  # Add Service Role Policies for Products Table

  1. Purpose
    - Allow API backend (using service_role key) to insert and read products
    - Fix issue where service role inserts succeed but SELECT returns NULL due to RLS
    - Maintain existing user-scoped policies for frontend operations

  2. Changes
    - Add policy: Service role can insert products (bypasses RLS)
    - Add policy: Service role can select all products (bypasses RLS)
    - Add policy: Service role can update all products (bypasses RLS)
    - Add policy: Service role can delete all products (bypasses RLS)

  3. Security
    - Service role has full access (appropriate for backend API)
    - Authenticated users maintain scoped access to their own data
    - Public users have no access (unchanged)
*/

-- Service role policies for products table
CREATE POLICY "Service role can insert products"
  ON products FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select products"
  ON products FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update products"
  ON products FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete products"
  ON products FOR DELETE
  TO service_role
  USING (true);
