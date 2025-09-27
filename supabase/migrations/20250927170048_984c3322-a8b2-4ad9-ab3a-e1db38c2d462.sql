-- Fix security issue by setting search_path for the maintenance function
create or replace function maintenance_clear_stale_blocks()
returns void 
language plpgsql 
security definer
set search_path = 'public'
as $$
begin
  update assignments
  set scheduled_block = null
  where scheduled_block is not null
    and (scheduled_date is null or scheduled_date::date <> current_date);
end;
$$;