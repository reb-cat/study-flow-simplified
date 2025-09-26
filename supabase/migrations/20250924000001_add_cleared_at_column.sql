-- Add cleared_at column to demo_assignments table to prevent immediate re-scheduling
ALTER TABLE public.demo_assignments
ADD COLUMN cleared_at TIMESTAMPTZ;

-- Add index for performance when filtering by cleared_at
CREATE INDEX idx_demo_assignments_cleared_at ON public.demo_assignments(cleared_at);