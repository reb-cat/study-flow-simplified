-- Update RLS policies for assignments table to allow students to update their assignment status
-- but restrict creation to admins only

-- Drop existing restrictive policies and add comprehensive ones
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.assignments;

-- Allow users to view their own assignments and demo assignments
CREATE POLICY "Users can view their own assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  (user_id = (auth.uid())::text) OR 
  (user_id ~~ 'demo-%'::text)
);

-- Allow users to update their own assignments (for status changes like complete, NMT, stuck)
CREATE POLICY "Users can update their own assignments"
ON public.assignments
FOR UPDATE
TO authenticated
USING (user_id = (auth.uid())::text)
WITH CHECK (user_id = (auth.uid())::text);

-- Only admins can create new assignments
CREATE POLICY "Admins can create assignments"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete assignments
CREATE POLICY "Admins can delete assignments"
ON public.assignments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));