-- Add needs_reschedule column to demo_assignments table for proper rescheduling system
ALTER TABLE public.demo_assignments
ADD COLUMN needs_reschedule BOOLEAN DEFAULT false;

-- Add index for performance when filtering rescheduled assignments
CREATE INDEX idx_demo_assignments_needs_reschedule ON public.demo_assignments(needs_reschedule);

-- Update existing assignments with scheduled_block = 999 to be marked as needing reschedule
UPDATE public.demo_assignments
SET needs_reschedule = true
WHERE scheduled_block = 999;