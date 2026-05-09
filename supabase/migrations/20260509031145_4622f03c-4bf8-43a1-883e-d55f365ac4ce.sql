-- 1. Add Instagram and TikTok handles to students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS tiktok_handle text;

-- 2. Daily follower snapshots (Instagram only for now)
CREATE TABLE IF NOT EXISTS public.follower_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  platform text NOT NULL DEFAULT 'instagram',
  handle text NOT NULL,
  followers integer NOT NULL DEFAULT 0,
  follows integer NOT NULL DEFAULT 0,
  posts_count integer NOT NULL DEFAULT 0,
  captured_date date NOT NULL DEFAULT (now() at time zone 'utc')::date,
  captured_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, platform, captured_date)
);

CREATE INDEX IF NOT EXISTS idx_follower_snapshots_student_date
  ON public.follower_snapshots(student_id, captured_date DESC);

ALTER TABLE public.follower_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read follower snapshots"
  ON public.follower_snapshots FOR SELECT USING (true);
CREATE POLICY "Anyone can insert follower snapshots"
  ON public.follower_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update follower snapshots"
  ON public.follower_snapshots FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete follower snapshots"
  ON public.follower_snapshots FOR DELETE USING (true);

-- 3. Categories per calendar (per student)
CREATE TABLE IF NOT EXISTS public.student_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, name)
);

CREATE INDEX IF NOT EXISTS idx_student_categories_student
  ON public.student_categories(student_id, order_index);

ALTER TABLE public.student_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read student categories"
  ON public.student_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can insert student categories"
  ON public.student_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update student categories"
  ON public.student_categories FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete student categories"
  ON public.student_categories FOR DELETE USING (true);

CREATE TRIGGER update_student_categories_updated_at
  BEFORE UPDATE ON public.student_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follower_snapshots;