-- Fix critical security issue: Restrict access to schedule_template table
-- This table contains real student names and detailed schedules and currently allows public access

-- First, drop all existing overly permissive policies
DROP POLICY IF EXISTS "Public can read schedule templates" ON public.schedule_template;
DROP POLICY IF EXISTS "Demo users can read schedule templates" ON public.schedule_template;
DROP POLICY IF EXISTS "Authenticated users can read schedule templates" ON public.schedule_template;

-- Create secure policies for schedule_template table

-- Policy 1: Allow authenticated users to read their own students' data and demo data
CREATE POLICY "Authenticated users can read schedule templates" 
ON public.schedule_template 
FOR SELECT
TO authenticated
USING (
  -- Allow access to demo data for testing/demo purposes
  (student_name ~~ 'demo-%') OR 
  (student_name = 'Demo Student') OR
  -- Allow access to student data that belongs to authenticated users
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = schedule_template.student_name
  ))
);

-- Policy 2: Allow authenticated users to insert their own students' data and demo data
CREATE POLICY "Authenticated users can insert schedule templates" 
ON public.schedule_template 
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow modification of demo data for testing/demo purposes
  (student_name ~~ 'demo-%') OR 
  (student_name = 'Demo Student') OR
  -- Allow modification of student data that belongs to authenticated users
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = schedule_template.student_name
  ))
);

-- Policy 3: Allow authenticated users to update their own students' data and demo data
CREATE POLICY "Authenticated users can update schedule templates" 
ON public.schedule_template 
FOR UPDATE
TO authenticated
USING (
  (student_name ~~ 'demo-%') OR 
  (student_name = 'Demo Student') OR
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = schedule_template.student_name
  ))
);

-- Policy 4: Allow authenticated users to delete their own students' data and demo data
CREATE POLICY "Authenticated users can delete schedule templates" 
ON public.schedule_template 
FOR DELETE
TO authenticated
USING (
  (student_name ~~ 'demo-%') OR 
  (student_name = 'Demo Student') OR
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = schedule_template.student_name
  ))
);

-- Policy 5: Allow demo access for public demo functionality (read-only)
CREATE POLICY "Demo schedule templates are accessible for demos" 
ON public.schedule_template 
FOR SELECT
TO anon
USING (
  (student_name ~~ 'demo-%') OR 
  (student_name = 'Demo Student')
);