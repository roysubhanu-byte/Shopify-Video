/*
  # Sync Auth Users to Custom Users Table

  ## Problem
  The application has a dual-user system:
  - `auth.users` - Managed by Supabase Auth (authentication)
  - `public.users` - Custom table for app data (credits, etc.)

  When users sign up via Supabase Auth, they only exist in `auth.users`.
  This causes foreign key constraint failures when trying to insert records
  that reference `public.users(id)`.

  ## Solution
  Create a trigger that automatically syncs new users from `auth.users`
  to `public.users` whenever someone signs up.

  ## Changes
  1. Create trigger function to handle new user creation
  2. Attach trigger to auth.users table
  3. Backfill existing auth users into public.users table
  4. This ensures all foreign key constraints pass

  ## Industry Standard
  This is the recommended Supabase pattern for maintaining a custom users
  table alongside auth.users. See: https://supabase.com/docs/guides/auth/managing-user-data
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, credits, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    50, -- Default credits
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicates if user already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing auth users into public.users
INSERT INTO public.users (id, email, credits, created_at)
SELECT
  id,
  email,
  50 as credits,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;