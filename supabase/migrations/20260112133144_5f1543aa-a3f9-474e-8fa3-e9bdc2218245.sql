-- Create storage bucket for deal attachments (used by chat and documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-attachments', 'deal-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to deal-attachments
CREATE POLICY "Authenticated users can upload deal attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'deal-attachments' 
  AND auth.role() = 'authenticated'
);

-- Allow anyone to view deal attachments (public bucket)
CREATE POLICY "Anyone can view deal attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'deal-attachments');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own deal attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'deal-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Add message_id column to deal_attachments for chat file attachments
ALTER TABLE deal_attachments 
ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES deal_messages(id) ON DELETE CASCADE;