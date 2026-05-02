-- Add media_urls to content_posts
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS media_urls text[] NOT NULL DEFAULT '{}';

-- Enable realtime
ALTER TABLE public.content_posts REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='content_posts';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.content_posts';
  END IF;
END $$;

-- Storage bucket for post media (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (public read/write/delete since this is a name-only login app)
DROP POLICY IF EXISTS "Public read post-media" ON storage.objects;
CREATE POLICY "Public read post-media" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');

DROP POLICY IF EXISTS "Public upload post-media" ON storage.objects;
CREATE POLICY "Public upload post-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media');

DROP POLICY IF EXISTS "Public delete post-media" ON storage.objects;
CREATE POLICY "Public delete post-media" ON storage.objects FOR DELETE USING (bucket_id = 'post-media');