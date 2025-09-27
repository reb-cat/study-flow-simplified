-- Create maintenance function to clear stale scheduled blocks
create or replace function maintenance_clear_stale_blocks()
returns void language plpgsql as $$
begin
  update assignments
  set scheduled_block = null
  where scheduled_block is not null
    and (scheduled_date is null or scheduled_date::date <> current_date);
end;
$$;

-- Run once now to clean existing stale data
select maintenance_clear_stale_blocks();

-- Enable pg_cron extension if not already enabled
create extension if not exists pg_cron;

-- Schedule daily cleanup at 4 AM
select cron.schedule('clear_stale_blocks_daily', '0 4 * * *', $$select maintenance_clear_stale_blocks();$$);