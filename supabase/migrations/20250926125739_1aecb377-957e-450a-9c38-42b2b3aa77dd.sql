-- Add RLS policy for the remaining __migrations table

-- ===== __MIGRATIONS TABLE =====
-- This table tracks migration history - should be system only
CREATE POLICY "System only access to migrations" 
ON public.__migrations 
FOR ALL
TO service_role
USING (true);