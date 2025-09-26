-- Fix RLS policies for demo_assignments to allow authenticated updates
-- The issue: demo_assignments only had SELECT policy, no UPDATE policy

-- Add UPDATE policy for demo assignments
-- Allow updates when user_id matches the authenticated user OR for demo users
CREATE POLICY "Users can update demo assignments"
ON public.demo_assignments
FOR UPDATE
USING (user_id = (auth.uid())::text OR user_id LIKE 'demo-%');

-- Also add INSERT and DELETE policies for completeness
CREATE POLICY "Users can insert demo assignments"
ON public.demo_assignments
FOR INSERT
WITH CHECK (user_id = (auth.uid())::text OR user_id LIKE 'demo-%');

CREATE POLICY "Users can delete demo assignments"
ON public.demo_assignments
FOR DELETE
USING (user_id = (auth.uid())::text OR user_id LIKE 'demo-%');

-- Add index on user_id for performance
CREATE INDEX IF NOT EXISTS idx_demo_assignments_user_id ON public.demo_assignments(user_id);