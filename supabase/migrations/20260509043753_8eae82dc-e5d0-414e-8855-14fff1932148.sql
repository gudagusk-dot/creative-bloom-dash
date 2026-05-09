ALTER TABLE public.students ADD COLUMN IF NOT EXISTS avatar_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('student-avatars', 'student-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read student avatars" ON storage.objects;
CREATE POLICY "Public read student avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-avatars');

DROP POLICY IF EXISTS "Anyone can upload student avatars" ON storage.objects;
CREATE POLICY "Anyone can upload student avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'student-avatars');

DROP POLICY IF EXISTS "Anyone can update student avatars" ON storage.objects;
CREATE POLICY "Anyone can update student avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'student-avatars');

DROP POLICY IF EXISTS "Anyone can delete student avatars" ON storage.objects;
CREATE POLICY "Anyone can delete student avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'student-avatars');