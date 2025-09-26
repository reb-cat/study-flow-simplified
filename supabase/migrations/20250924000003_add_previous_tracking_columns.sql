-- Add previous_date and previous_block columns to track where assignments were cleared from
-- This prevents assignments from being immediately rescheduled to the same slot

ALTER TABLE public.demo_assignments
ADD COLUMN previous_date text,
ADD COLUMN previous_block integer;

-- Add index for performance when filtering by previous tracking
CREATE INDEX IF NOT EXISTS idx_demo_assignments_previous ON public.demo_assignments(previous_date, previous_block);