-- Create employee_attachments table
CREATE TABLE public.employee_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  attachment_type TEXT,
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_attachments ENABLE ROW LEVEL SECURITY;

-- Only admins can manage employee attachments
CREATE POLICY "Only admins can manage employee attachments"
ON public.employee_attachments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for employee attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-attachments', 'employee-attachments', false);

-- Storage policies for employee attachments
CREATE POLICY "Admins can upload employee attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'employee-attachments' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view employee attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'employee-attachments' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete employee attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'employee-attachments' AND has_role(auth.uid(), 'admin'::app_role));