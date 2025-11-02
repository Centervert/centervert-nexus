-- Make opportunity-attachments bucket public so PDFs can be viewed in iframe
UPDATE storage.buckets 
SET public = true 
WHERE id = 'opportunity-attachments';