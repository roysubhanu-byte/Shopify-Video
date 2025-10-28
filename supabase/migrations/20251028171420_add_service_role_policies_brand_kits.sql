/*
  # Add Service Role Policies for Brand Kits Table

  1. Purpose
    - Allow API backend (using service_role key) to insert and read brand kits
    - Fix issue where service role inserts succeed but SELECT returns NULL due to RLS
    - Maintain existing user-scoped policies for frontend operations

  2. Changes
    - Add policy: Service role can insert brand kits (bypasses RLS)
    - Add policy: Service role can select all brand kits (bypasses RLS)
    - Add policy: Service role can update all brand kits (bypasses RLS)
    - Add policy: Service role can delete all brand kits (bypasses RLS)

  3. Security
    - Service role has full access (appropriate for backend API)
    - Authenticated users maintain scoped access to their own data
    - Public users have no access (unchanged)
*/

-- Service role policies for brand_kits table
CREATE POLICY "Service role can insert brand_kits"
  ON brand_kits FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select brand_kits"
  ON brand_kits FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update brand_kits"
  ON brand_kits FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete brand_kits"
  ON brand_kits FOR DELETE
  TO service_role
  USING (true);
