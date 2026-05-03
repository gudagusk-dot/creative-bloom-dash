CREATE TABLE public.post_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_activity_user_created ON public.post_activity(user_id, created_at DESC);
CREATE INDEX idx_post_activity_post ON public.post_activity(post_id);

ALTER TABLE public.post_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read activity" ON public.post_activity FOR SELECT USING (true);
CREATE POLICY "Anyone can insert activity" ON public.post_activity FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.post_activity;
ALTER TABLE public.post_activity REPLICA IDENTITY FULL;