-- Fix critical security vulnerabilities: Secure student_profiles and student_scheduling_profiles tables
-- Issue: These tables expose sensitive student personal and medical information

-- Fix student_profiles table security
-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can view student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Demo profiles are publicly viewable" ON public.student_profiles;

-- Create a proper security definer function to check if a user can access a student's profile
-- This prevents RLS recursion issues while maintaining security
CREATE OR REPLACE FUNCTION public.can_access_student_profile(student_name_param text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- For now, since there's no explicit user-student relationship table,
  -- we'll restrict access to authenticated users only (no public access)
  -- and allow demo profiles for testing
  SELECT 
    CASE 
      WHEN student_name_param ~~ 'demo-%' THEN true
      WHEN student_name_param = 'Demo Student' THEN true
      WHEN auth.uid() IS NOT NULL THEN true  -- Authenticated users can access
      ELSE false
    END;
$$;

-- Create secure policy for student_profiles (authenticated users only)
CREATE POLICY "Authenticated users can view student profiles securely" 
ON public.student_profiles 
FOR SELECT
TO authenticated
USING (public.can_access_student_profile(student_name));

-- Keep demo profiles accessible for demo functionality (read-only, anonymous access)
CREATE POLICY "Demo profiles accessible for demos" 
ON public.student_profiles 
FOR SELECT
TO anon
USING (
  (student_name ~~ 'demo-%') OR 
  (student_name = 'Demo Student')
);

-- Fix student_scheduling_profiles table security
-- Drop all the overly permissive policies that allow public access
DROP POLICY IF EXISTS "Authenticated users can read scheduling profiles" ON public.student_scheduling_profiles;
DROP POLICY IF EXISTS "Demo users can read scheduling profiles" ON public.student_scheduling_profiles;
DROP POLICY IF EXISTS "Public can read scheduling profiles" ON public.student_scheduling_profiles;

-- Create secure policy for student_scheduling_profiles (authenticated users only)
CREATE POLICY "Authenticated users can view scheduling profiles securely" 
ON public.student_scheduling_profiles 
FOR SELECT
TO authenticated
USING (public.can_access_student_profile(student_name));

-- Keep demo scheduling profiles accessible for demo functionality (read-only, anonymous access)
CREATE POLICY "Demo scheduling profiles accessible for demos" 
ON public.student_scheduling_profiles 
FOR SELECT
TO anon
USING (
  (student_name ~~ 'demo-%') OR 
  (student_name = 'Demo Student')
);

-- Ensure both tables have RLS enabled (should already be enabled)
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_scheduling_profiles ENABLE ROW LEVEL SECURITY;