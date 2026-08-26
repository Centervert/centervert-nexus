CREATE TABLE public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  copy text,
  platforms text[] NOT NULL DEFAULT '{}',
  media_urls text[] NOT NULL DEFAULT '{}',
  scheduled_date date NOT NULL,
  scheduled_time time,
  status text NOT NULL DEFAULT 'draft',
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_posts TO authenticated;
GRANT ALL ON public.social_posts TO service_role;

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed in users can view social posts"
ON public.social_posts FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins and team members can create social posts"
ON public.social_posts FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins and team members can update social posts"
ON public.social_posts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins and team members can delete social posts"
ON public.social_posts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE INDEX idx_social_posts_scheduled_date ON public.social_posts(scheduled_date);

CREATE TRIGGER set_social_posts_updated_at
BEFORE UPDATE ON public.social_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_social_posts
AFTER INSERT OR UPDATE OR DELETE ON public.social_posts
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();