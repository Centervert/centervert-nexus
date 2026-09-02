DROP POLICY IF EXISTS "Admins and team members can create social posts" ON public.social_posts;
DROP POLICY IF EXISTS "Admins and team members can update social posts" ON public.social_posts;
DROP POLICY IF EXISTS "Admins and team members can delete social posts" ON public.social_posts;

CREATE POLICY "Staff can create social posts"
ON public.social_posts FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'sales_agent'));

CREATE POLICY "Staff can update social posts"
ON public.social_posts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'sales_agent'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'sales_agent'));

CREATE POLICY "Staff can delete social posts"
ON public.social_posts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'sales_agent'));

DROP POLICY IF EXISTS "Team can upload social media" ON storage.objects;
DROP POLICY IF EXISTS "Team can update social media" ON storage.objects;
DROP POLICY IF EXISTS "Team can delete social media" ON storage.objects;

CREATE POLICY "Team can upload social media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'social-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'sales_agent')));

CREATE POLICY "Team can update social media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'social-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'sales_agent')));

CREATE POLICY "Team can delete social media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'social-media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'sales_agent')));