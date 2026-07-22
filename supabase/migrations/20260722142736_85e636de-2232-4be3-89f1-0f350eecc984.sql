
CREATE TABLE public.employee_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  content text NOT NULL,
  category text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_notes TO authenticated;
GRANT ALL ON public.employee_notes TO service_role;

ALTER TABLE public.employee_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view employee notes"
  ON public.employee_notes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert employee notes"
  ON public.employee_notes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins can update own employee notes"
  ON public.employee_notes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins can delete own employee notes"
  ON public.employee_notes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE INDEX employee_notes_employee_id_created_at_idx
  ON public.employee_notes (employee_id, created_at DESC);

CREATE TRIGGER employee_notes_updated_at
  BEFORE UPDATE ON public.employee_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_notes;
ALTER TABLE public.employee_notes REPLICA IDENTITY FULL;
