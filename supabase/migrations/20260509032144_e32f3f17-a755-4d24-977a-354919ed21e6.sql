-- Create follower_snapshots table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.follower_snapshots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL,
    handle TEXT NOT NULL,
    followers INTEGER NOT NULL,
    follows INTEGER,
    posts_count INTEGER,
    captured_date DATE NOT NULL DEFAULT CURRENT_DATE,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    raw JSONB,
    UNIQUE(student_id, platform, captured_date)
);

-- Enable RLS
ALTER TABLE public.follower_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all snapshots (admin view)
CREATE POLICY "Snapshots are viewable by authenticated users" 
ON public.follower_snapshots 
FOR SELECT 
TO authenticated 
USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_follower_snapshots_date ON public.follower_snapshots(student_id, captured_date);