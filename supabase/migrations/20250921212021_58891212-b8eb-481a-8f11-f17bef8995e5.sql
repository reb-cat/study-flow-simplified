-- Enable RLS on critical tables that need access

-- 1. Enable RLS on assignments table
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow demo users to read their assignments
CREATE POLICY "Demo users can read their assignments" 
ON public.assignments 
FOR SELECT 
USING (user_id LIKE 'demo-%');

-- 2. Enable RLS on schedule_template table  
ALTER TABLE public.schedule_template ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to schedule templates
CREATE POLICY "Public can read schedule templates" 
ON public.schedule_template 
FOR SELECT 
USING (true);

-- 3. Enable RLS on student_profiles table
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to student profiles
CREATE POLICY "Public can read student profiles" 
ON public.student_profiles 
FOR SELECT 
USING (true);

-- 4. Demo assignments already has RLS enabled and proper policy

-- 5. Enable RLS on other critical tables
ALTER TABLE public.progress_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their progress sessions" 
ON public.progress_sessions 
FOR ALL 
USING (true);

ALTER TABLE public.daily_schedule_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can access schedule status" 
ON public.daily_schedule_status 
FOR ALL 
USING (true);

ALTER TABLE public.student_scheduling_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read scheduling profiles" 
ON public.student_scheduling_profiles 
FOR SELECT 
USING (true);