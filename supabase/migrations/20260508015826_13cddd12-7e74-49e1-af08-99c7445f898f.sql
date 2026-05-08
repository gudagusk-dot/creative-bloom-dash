CREATE TABLE public.post_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT '',
  likes integer NOT NULL DEFAULT 0,
  views integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  engagement_rate numeric NOT NULL DEFAULT 0,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_metrics_post_id ON public.post_metrics(post_id);

ALTER TABLE public.post_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read metrics" ON public.post_metrics FOR SELECT USING (true);
CREATE POLICY "Anyone can insert metrics" ON public.post_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update metrics" ON public.post_metrics FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete metrics" ON public.post_metrics FOR DELETE USING (true);

CREATE TRIGGER update_post_metrics_updated_at
BEFORE UPDATE ON public.post_metrics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();