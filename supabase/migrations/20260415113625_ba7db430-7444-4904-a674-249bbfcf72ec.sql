
CREATE TABLE public.simple_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.simple_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read users" ON public.simple_users FOR SELECT USING (true);
CREATE POLICY "Anyone can create users" ON public.simple_users FOR INSERT WITH CHECK (true);

CREATE TABLE public.content_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.simple_users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  format TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  network TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'A fazer',
  notes TEXT NOT NULL DEFAULT '',
  script TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read posts" ON public.content_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert posts" ON public.content_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update posts" ON public.content_posts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete posts" ON public.content_posts FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_content_posts_updated_at
  BEFORE UPDATE ON public.content_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
