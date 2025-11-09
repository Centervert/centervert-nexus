-- Add submitted tracking to opportunities table
ALTER TABLE opportunities 
ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN submitted_by UUID REFERENCES profiles(id);