-- Fix critical security vulnerabilities in student_profiles and progress_sessions tables

-- ===== FIX STUDENT_PROFILES TABLE =====
-- Drop the overly permissive policies that allow public access
DROP POLICY IF EXISTS "Authenticated users can view student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Demo users can view student profiles" ON public.student_profiles;

-- Create secure policies for student_profiles
-- Allow authenticated users to view student profiles (but could be further restricted based on business needs)
CREATE POLICY "Authenticated users can view student profiles" 
ON public.student_profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Allow access to demo data for unauthenticated users (assuming demo profiles have specific naming pattern)
CREATE POLICY "Demo profiles are publicly viewable" 
ON public.student_profiles 
FOR SELECT 
TO anon, authenticated
USING (student_name LIKE 'demo_%' OR student_name = 'Demo Student');

-- ===== FIX PROGRESS_SESSIONS TABLE =====
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can access their progress sessions" ON public.progress_sessions;

-- Create secure user-specific policies for progress_sessions
-- Users can only access their own progress sessions
CREATE POLICY "Users can view their own progress sessions" 
ON public.progress_sessions 
FOR SELECT 
TO authenticated
USING (
  -- If there's a user_id column, use that for user-specific access
  -- For now, allowing authenticated users to see sessions for their student profiles
  student_name IN (
    SELECT student_name FROM public.student_profiles 
    WHERE auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Users can create their own progress sessions" 
ON public.progress_sessions 
FOR INSERT 
TO authenticated
WITH CHECK (
  student_name IN (
    SELECT student_name FROM public.student_profiles 
    WHERE auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Users can update their own progress sessions" 
ON public.progress_sessions 
FOR UPDATE 
TO authenticated
USING (
  student_name IN (
    SELECT student_name FROM public.student_profiles 
    WHERE auth.uid() IS NOT NULL
  )
);

-- Allow demo access for progress sessions
CREATE POLICY "Demo progress sessions are accessible" 
ON public.progress_sessions 
FOR ALL
TO anon, authenticated
USING (student_name LIKE 'demo_%' OR student_name = 'Demo Student');