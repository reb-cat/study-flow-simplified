-- Fix remaining RLS security issues for system tables

-- Enable RLS on migrations table (system table - no public access needed)
ALTER TABLE public.__migrations ENABLE ROW LEVEL SECURITY;

-- No policies needed for migrations table - it should not be accessible via PostgREST

-- Enable RLS on seed_status table (system table - no public access needed) 
ALTER TABLE public.seed_status ENABLE ROW LEVEL SECURITY;

-- No policies needed for seed_status table - it should not be accessible via PostgREST

-- Fix function security by setting search_path for existing functions
CREATE OR REPLACE FUNCTION public.update_worksheet_answers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger  
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;