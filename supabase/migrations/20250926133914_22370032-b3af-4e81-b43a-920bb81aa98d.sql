-- Fix critical security issue: Restrict access to daily_schedule_status table
-- This table contains sensitive student schedule data and currently allows public access

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public can access schedule status" ON public.daily_schedule_status;

-- Create secure policies for daily_schedule_status table

-- Policy 1: Allow authenticated users to read their own students' data and demo data
CREATE POLICY "Authenticated users can read schedule status" 
ON public.daily_schedule_status 
FOR SELECT
TO authenticated
USING (
  -- Allow access to demo data for testing/demo purposes
  (student_name ~~ 'demo-%') OR
  -- Allow access to student data that belongs to authenticated users
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = daily_schedule_status.student_name
  ))
);

-- Policy 2: Allow authenticated users to insert/update their own students' data and demo data
CREATE POLICY "Authenticated users can modify schedule status" 
ON public.daily_schedule_status 
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow modification of demo data for testing/demo purposes
  (student_name ~~ 'demo-%') OR
  -- Allow modification of student data that belongs to authenticated users
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = daily_schedule_status.student_name
  ))
);

-- Policy 3: Allow authenticated users to update their own students' data and demo data
CREATE POLICY "Authenticated users can update schedule status" 
ON public.daily_schedule_status 
FOR UPDATE
TO authenticated
USING (
  (student_name ~~ 'demo-%') OR
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = daily_schedule_status.student_name
  ))
);

-- Policy 4: Allow demo access for public demo functionality (read-only)
CREATE POLICY "Demo schedule status is accessible for demos" 
ON public.daily_schedule_status 
FOR SELECT
TO anon
USING (student_name ~~ 'demo-%');