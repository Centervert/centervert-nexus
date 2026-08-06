-- ============ wiki_pages ============
CREATE TABLE public.wiki_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  page_type text NOT NULL DEFAULT 'blank',
  position integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_pages TO authenticated;
GRANT ALL ON public.wiki_pages TO service_role;

ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage wiki pages"
ON public.wiki_pages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Users can view accessible wiki pages"
ON public.wiki_pages FOR SELECT TO authenticated
USING (
  project_id IS NULL
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'agent')
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = wiki_pages.project_id
      AND (
        p.owner_id = auth.uid()
        OR p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_team_members ptm
          WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid()
        )
      )
  )
);

CREATE INDEX idx_wiki_pages_project ON public.wiki_pages(project_id);
CREATE INDEX idx_wiki_pages_parent ON public.wiki_pages(parent_id);
CREATE INDEX idx_wiki_pages_search ON public.wiki_pages
  USING gin (to_tsvector('english', title || ' ' || body));

CREATE TRIGGER wiki_pages_updated_at
BEFORE UPDATE ON public.wiki_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_wiki_pages
AFTER INSERT OR UPDATE OR DELETE ON public.wiki_pages
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- ============ project_links ============
CREATE TABLE public.project_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label text NOT NULL,
  url text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  note text,
  owner_id uuid REFERENCES public.profiles(id),
  position integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_links TO authenticated;
GRANT ALL ON public.project_links TO service_role;

ALTER TABLE public.project_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage project links"
ON public.project_links FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Users can view their project links"
ON public.project_links FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'agent')
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_links.project_id
      AND (
        p.owner_id = auth.uid()
        OR p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_team_members ptm
          WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid()
        )
      )
  )
);

CREATE INDEX idx_project_links_project ON public.project_links(project_id);

CREATE TRIGGER project_links_updated_at
BEFORE UPDATE ON public.project_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_project_links
AFTER INSERT OR UPDATE OR DELETE ON public.project_links
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- ============ project_secret_refs ============
CREATE TABLE public.project_secret_refs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  manager text NOT NULL DEFAULT 'other',
  location_path text,
  environment text NOT NULL DEFAULT 'all',
  owner_id uuid REFERENCES public.profiles(id),
  rotation_notes text,
  last_rotated_on date,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_secret_refs TO authenticated;
GRANT ALL ON public.project_secret_refs TO service_role;

ALTER TABLE public.project_secret_refs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage secret refs"
ON public.project_secret_refs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Team can view secret refs"
ON public.project_secret_refs FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'agent')
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_secret_refs.project_id
      AND (
        p.owner_id = auth.uid()
        OR p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.project_team_members ptm
          WHERE ptm.project_id = p.id AND ptm.user_id = auth.uid()
        )
      )
  )
);

CREATE INDEX idx_project_secret_refs_project ON public.project_secret_refs(project_id);

CREATE TRIGGER project_secret_refs_updated_at
BEFORE UPDATE ON public.project_secret_refs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_project_secret_refs
AFTER INSERT OR UPDATE OR DELETE ON public.project_secret_refs
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();