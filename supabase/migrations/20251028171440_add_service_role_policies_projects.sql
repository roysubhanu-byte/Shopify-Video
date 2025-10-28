/*
  # Add Service Role Policies for Projects Table

  1. Purpose
    - Allow API backend (using service_role key) to insert and read projects
    - Fix issue where service role inserts succeed but SELECT returns NULL due to RLS
    - Maintain existing user-scoped policies for frontend operations

  2. Changes
    - Add policy: Service role can insert projects (bypasses RLS)
    - Add policy: Service role can select all projects (bypasses RLS)
    - Add policy: Service role can update all projects (bypasses RLS)
    - Add policy: Service role can delete all projects (bypasses RLS)

  3. Security
    - Service role has full access (appropriate for backend API)
    - Authenticated users maintain scoped access to their own data
    - Public users have no access (unchanged)
*/

-- Service role policies for projects table
CREATE POLICY "Service role can insert projects"
  ON projects FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select projects"
  ON projects FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update projects"
  ON projects FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete projects"
  ON projects FOR DELETE
  TO service_role
  USING (true);
