ALTER TABLE public.content_posts 
ADD COLUMN IF NOT EXISTS instagram_published_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_published_url TEXT;