-- Complete the RLS policies with proper auth.uid() function
CREATE POLICY "Users can manage own assignment completions" 
  ON public.assignment_completions 
  FOR ALL 
  USING (user_id = (auth.uid())::text OR user_id LIKE 'demo-%');

CREATE POLICY "Users can manage own assignment reschedules" 
  ON public.assignment_reschedules 
  FOR ALL 
  USING (user_id = (auth.uid())::text OR user_id LIKE 'demo-%');

-- Correct foreign key references to schedule_template instead of daily_schedule_status
ALTER TABLE public.assignment_completions 
  ADD CONSTRAINT fk_original_block_id 
  FOREIGN KEY (original_block_id) 
  REFERENCES public.schedule_template(id) ON DELETE CASCADE;

ALTER TABLE public.assignment_reschedules
  ADD CONSTRAINT fk_from_block_id 
  FOREIGN KEY (from_block_id) 
  REFERENCES public.schedule_template(id) ON DELETE CASCADE;

ALTER TABLE public.assignment_reschedules
  ADD CONSTRAINT fk_to_block_id 
  FOREIGN KEY (to_block_id) 
  REFERENCES public.schedule_template(id) ON DELETE CASCADE;

-- Add performance indexes
CREATE INDEX idx_assignment_completions_user_id ON public.assignment_completions(user_id);
CREATE INDEX idx_assignment_completions_assignment_id ON public.assignment_completions(assignment_id);
CREATE INDEX idx_assignment_reschedules_user_id ON public.assignment_reschedules(user_id);
CREATE INDEX idx_assignment_reschedules_assignment_id ON public.assignment_reschedules(assignment_id);

-- Add update triggers for automatic timestamp updates
CREATE TRIGGER update_assignment_completions_updated_at 
  BEFORE UPDATE ON public.assignment_completions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_reschedules_updated_at 
  BEFORE UPDATE ON public.assignment_reschedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();