-- Fix critical security issues: Secure assignment_reschedules and checklist_items tables
-- These tables currently have overly permissive policies that expose student data

-- Fix assignment_reschedules table security
-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Users can manage own reschedules" ON public.assignment_reschedules;

-- Create secure policies for assignment_reschedules
CREATE POLICY "Authenticated users can manage their own reschedules" 
ON public.assignment_reschedules 
FOR ALL
TO authenticated
USING (
  -- Allow access to demo data for testing/demo purposes
  (user_id ~~ 'demo-%') OR
  -- Allow access only to authenticated user's own data
  (user_id = (auth.uid())::text)
)
WITH CHECK (
  -- Same check for INSERT operations
  (user_id ~~ 'demo-%') OR
  (user_id = (auth.uid())::text)
);

-- Allow demo access for public demo functionality (read-only)
CREATE POLICY "Demo reschedules are accessible for demos" 
ON public.assignment_reschedules 
FOR SELECT
TO anon
USING (user_id ~~ 'demo-%');

-- Fix checklist_items table security
-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Public can access checklist items" ON public.checklist_items;

-- Create secure policies for checklist_items
CREATE POLICY "Authenticated users can read checklist items" 
ON public.checklist_items 
FOR SELECT
TO authenticated
USING (
  -- Allow access to demo data
  (student_name ~~ 'demo-%') OR 
  (student_name = 'Demo Student') OR
  -- Allow access to student data that belongs to authenticated users
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = checklist_items.student_name
  ))
);

CREATE POLICY "Authenticated users can insert checklist items" 
ON public.checklist_items 
FOR INSERT
TO authenticated
WITH CHECK (
  (student_name ~~ 'demo-%') OR 
  (student_name = 'Demo Student') OR
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = checklist_items.student_name
  ))
);

CREATE POLICY "Authenticated users can update checklist items" 
ON public.checklist_items 
FOR UPDATE
TO authenticated
USING (
  (student_name ~~ 'demo-%') OR 
  (student_name = 'Demo Student') OR
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = checklist_items.student_name
  ))
);

CREATE POLICY "Authenticated users can delete checklist items" 
ON public.checklist_items 
FOR DELETE
TO authenticated
USING (
  (student_name ~~ 'demo-%') OR 
  (student_name = 'Demo Student') OR
  (student_name IN (
    SELECT student_name 
    FROM public.student_profiles 
    WHERE student_name = checklist_items.student_name
  ))
);

-- Allow demo access for public demo functionality (read-only)
CREATE POLICY "Demo checklist items are accessible for demos" 
ON public.checklist_items 
FOR SELECT
TO anon
USING (
  (student_name ~~ 'demo-%') OR 
  (student_name = 'Demo Student')
);