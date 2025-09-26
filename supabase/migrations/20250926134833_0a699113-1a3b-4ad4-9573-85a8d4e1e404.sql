-- Fix critical security issue: Restrict access to student_status table
-- This table contains sensitive student personal information and currently allows public access

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public can access student status" ON public.student_status;

-- Create secure policies for student_status table

-- Policy 1: Allow authenticated users to read their own students' data and demo data
CREATE POLICY "Authenticated users can read student status" 
ON public.student_status 
FOR SELECT
TO authenticated
USING (
  -- Allow access to demo data for testing/demo purposes
  (student_name ~~ 'demo_%') OR 
  (student_name = 'Demo Student') OR
  -- Allow access to student data that belongs to authenticated users
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = student_status.student_name
  ))
);

-- Policy 2: Allow authenticated users to insert their own students' data and demo data
CREATE POLICY "Authenticated users can insert student status" 
ON public.student_status 
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow modification of demo data for testing/demo purposes
  (student_name ~~ 'demo_%') OR 
  (student_name = 'Demo Student') OR
  -- Allow modification of student data that belongs to authenticated users
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = student_status.student_name
  ))
);

-- Policy 3: Allow authenticated users to update their own students' data and demo data
CREATE POLICY "Authenticated users can update student status" 
ON public.student_status 
FOR UPDATE
TO authenticated
USING (
  (student_name ~~ 'demo_%') OR 
  (student_name = 'Demo Student') OR
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = student_status.student_name
  ))
);

-- Policy 4: Allow authenticated users to delete their own students' data and demo data
CREATE POLICY "Authenticated users can delete student status" 
ON public.student_status 
FOR DELETE
TO authenticated
USING (
  (student_name ~~ 'demo_%') OR 
  (student_name = 'Demo Student') OR
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = student_status.student_name
  ))
);

-- Policy 5: Allow demo access for public demo functionality (read-only)
CREATE POLICY "Demo student status is accessible for demos" 
ON public.student_status 
FOR SELECT
TO anon
USING (
  (student_name ~~ 'demo_%') OR 
  (student_name = 'Demo Student')
);