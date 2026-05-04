-- 1. Tabela students
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_owner ON public.students(owner_id);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Anyone can insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete students" ON public.students FOR DELETE USING (true);

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Novas colunas em content_posts
ALTER TABLE public.content_posts
  ADD COLUMN student_id UUID,
  ADD COLUMN published_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN student_notes TEXT NOT NULL DEFAULT '';

CREATE INDEX idx_content_posts_student ON public.content_posts(student_id);

-- 3. Nova coluna em post_activity
ALTER TABLE public.post_activity
  ADD COLUMN student_id UUID;

CREATE INDEX idx_post_activity_student ON public.post_activity(student_id);

-- 4. Backfill: para cada admin (user_id distinto em content_posts), cria um aluno "Meu Calendário"
DO $$
DECLARE
  rec RECORD;
  new_student_id UUID;
  new_slug TEXT;
  base_slug TEXT;
  counter INT;
  admin_name TEXT;
BEGIN
  FOR rec IN SELECT DISTINCT user_id FROM public.content_posts WHERE student_id IS NULL LOOP
    SELECT name INTO admin_name FROM public.simple_users WHERE id = rec.user_id;
    base_slug := COALESCE(
      regexp_replace(lower(unaccent(coalesce(admin_name, 'aluno'))), '[^a-z0-9]+', '-', 'g'),
      'aluno'
    );
    base_slug := trim(both '-' from base_slug);
    IF base_slug = '' THEN base_slug := 'aluno'; END IF;

    new_slug := base_slug;
    counter := 1;
    WHILE EXISTS (SELECT 1 FROM public.students WHERE slug = new_slug) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;

    INSERT INTO public.students (owner_id, name, slug)
    VALUES (rec.user_id, COALESCE(admin_name, 'Meu Calendário'), new_slug)
    RETURNING id INTO new_student_id;

    UPDATE public.content_posts SET student_id = new_student_id WHERE user_id = rec.user_id AND student_id IS NULL;
    UPDATE public.post_activity SET student_id = new_student_id WHERE user_id = rec.user_id AND student_id IS NULL;
  END LOOP;
EXCEPTION WHEN undefined_function THEN
  -- unaccent extension not available, fallback without it
  FOR rec IN SELECT DISTINCT user_id FROM public.content_posts WHERE student_id IS NULL LOOP
    SELECT name INTO admin_name FROM public.simple_users WHERE id = rec.user_id;
    base_slug := regexp_replace(lower(coalesce(admin_name, 'aluno')), '[^a-z0-9]+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    IF base_slug = '' THEN base_slug := 'aluno'; END IF;

    new_slug := base_slug;
    counter := 1;
    WHILE EXISTS (SELECT 1 FROM public.students WHERE slug = new_slug) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;

    INSERT INTO public.students (owner_id, name, slug)
    VALUES (rec.user_id, COALESCE(admin_name, 'Meu Calendário'), new_slug)
    RETURNING id INTO new_student_id;

    UPDATE public.content_posts SET student_id = new_student_id WHERE user_id = rec.user_id AND student_id IS NULL;
    UPDATE public.post_activity SET student_id = new_student_id WHERE user_id = rec.user_id AND student_id IS NULL;
  END LOOP;
END $$;

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;