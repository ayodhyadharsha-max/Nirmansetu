-- ==============================================================================
-- Migration 11: Fix Customer Profiles RLS Policies and Schema Robustness
-- ==============================================================================

-- 1. Ensure columns exist for backward/forward compatibility
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20);

-- 2. Ensure RLS is enabled on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Authenticated users can insert their own profile
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 4. Policy: Authenticated users can view own profile (or admin)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO public
    USING (auth.uid() = id OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. Policy: Authenticated users can update own profile
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 6. Policy: Admins have full management access
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins full manage profiles" ON public.profiles;
  CREATE POLICY "Admins full manage profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
