-- Create separate demo_assignments table for demo data
CREATE TABLE public.demo_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name text NOT NULL,
  title text NOT NULL,
  subject text,
  course_name text,
  due_date timestamp with time zone,
  scheduled_date text,
  scheduled_block integer,
  completed_at timestamp with time zone,
  time_spent integer DEFAULT 0,
  priority text DEFAULT 'B',
  difficulty text DEFAULT 'medium',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on demo table (but make it publicly readable for demo purposes)
ALTER TABLE public.demo_assignments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to demo data (no auth required)
CREATE POLICY "Demo assignments are publicly readable" 
ON public.demo_assignments 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_demo_assignments_updated_at
BEFORE UPDATE ON public.demo_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();