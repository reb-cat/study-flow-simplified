-- Add RLS policies for tables that have RLS enabled but no policies

-- ===== SEED_STATUS TABLE =====
-- This table tracks database seeding status - should be admin/system only
CREATE POLICY "System only access to seed status" 
ON public.seed_status 
FOR ALL
TO service_role
USING (true);

-- ===== SESSIONS TABLE =====
-- This appears to be session storage - should be system managed
CREATE POLICY "System only access to sessions" 
ON public.sessions 
FOR ALL
TO service_role
USING (true);