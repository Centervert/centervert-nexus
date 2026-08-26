CREATE POLICY "Signed in users can view social media files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'social-media');

CREATE POLICY "Admins and team members can upload social media files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'social-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent')));

CREATE POLICY "Admins and team members can update social media files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'social-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent')));

CREATE POLICY "Admins and team members can delete social media files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'social-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent')));