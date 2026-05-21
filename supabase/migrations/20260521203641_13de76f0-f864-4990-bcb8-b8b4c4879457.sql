-- Add calendar_published to students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS calendar_published BOOLEAN DEFAULT true;

-- Add published to content_posts
ALTER TABLE public.content_posts 
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

-- Update RLS for students if needed (though usually admin sees all)
-- Assuming students can only see their own content if calendar_published is true
-- We need to check existing policies first, but for now we'll handle the logic in the code/context
