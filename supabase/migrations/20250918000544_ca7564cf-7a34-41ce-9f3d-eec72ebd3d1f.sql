-- Add enrichment fields to assignments table
ALTER TABLE assignments 
ADD COLUMN speechify_url TEXT,
ADD COLUMN worksheet_questions JSONB,
ADD COLUMN interactive_type TEXT,
ADD COLUMN parent_notes TEXT,
ADD COLUMN requires_printing BOOLEAN DEFAULT FALSE;

-- Create table to store student worksheet answers
CREATE TABLE worksheet_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  answers JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  exported BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on worksheet_answers
ALTER TABLE worksheet_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for worksheet_answers
CREATE POLICY "Users can view their own worksheet answers" 
ON worksheet_answers 
FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create their own worksheet answers" 
ON worksheet_answers 
FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own worksheet answers" 
ON worksheet_answers 
FOR UPDATE 
USING (user_id = auth.uid()::text);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_worksheet_answers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_worksheet_answers_updated_at
  BEFORE UPDATE ON worksheet_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_worksheet_answers_updated_at();