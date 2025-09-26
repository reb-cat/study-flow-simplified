-- Remove unused columns that were part of the overcomplicated rescheduling system
-- These are no longer needed with the simple "block 999" after school approach

ALTER TABLE public.demo_assignments
DROP COLUMN IF EXISTS cleared_at,
DROP COLUMN IF EXISTS previous_date,
DROP COLUMN IF EXISTS previous_block;