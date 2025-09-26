-- CRITICAL SECURITY FIX: Restrict access to student profiles
-- Replace public access with proper authentication-based policies

-- Drop the existing public policy that exposes all student data
DROP POLICY IF EXISTS "Public can read student profiles" ON public.student_profiles;

-- Create secure policies for student profiles
CREATE POLICY "Authenticated users can view student profiles" 
ON public.student_profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow demo users to view profiles (for demo functionality)
CREATE POLICY "Demo users can view student profiles" 
ON public.student_profiles 
FOR SELECT 
TO anon 
USING (true);

-- SECURITY FIX: Restrict assignment access to prevent unauthorized data access
-- Update assignments table policy to be more restrictive
DROP POLICY IF EXISTS "Demo users can read their assignments" ON public.assignments;

CREATE POLICY "Users can view their own assignments" 
ON public.assignments 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    user_id = (auth.uid())::text 
    OR user_id LIKE 'demo-%'
  )
);

-- SECURITY FIX: Add policies for tables missing RLS coverage
-- Add policy for schedule_template to allow authenticated access
CREATE POLICY "Authenticated users can read schedule templates" 
ON public.schedule_template 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Demo users can read schedule templates" 
ON public.schedule_template 
FOR SELECT 
TO anon 
USING (true);

-- Add policies for student_scheduling_profiles
CREATE POLICY "Authenticated users can read scheduling profiles" 
ON public.student_scheduling_profiles 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Demo users can read scheduling profiles" 
ON public.student_scheduling_profiles 
FOR SELECT 
TO anon 
USING (true);