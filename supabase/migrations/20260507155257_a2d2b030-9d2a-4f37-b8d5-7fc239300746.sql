-- content_templates
CREATE TABLE public.content_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  format text NOT NULL,
  network text NOT NULL DEFAULT 'Instagram',
  default_title text NOT NULL DEFAULT '',
  default_script text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read templates" ON public.content_templates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert templates" ON public.content_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update templates" ON public.content_templates FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete templates" ON public.content_templates FOR DELETE USING (true);
CREATE TRIGGER update_content_templates_updated_at
  BEFORE UPDATE ON public.content_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_content_templates_owner ON public.content_templates(owner_id);

-- admin_visits
CREATE TABLE public.admin_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  student_id uuid NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, student_id)
);
ALTER TABLE public.admin_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read visits" ON public.admin_visits FOR SELECT USING (true);
CREATE POLICY "Anyone can insert visits" ON public.admin_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update visits" ON public.admin_visits FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete visits" ON public.admin_visits FOR DELETE USING (true);
CREATE INDEX idx_admin_visits_owner ON public.admin_visits(owner_id);