-- Remove the existing single-column unique constraint if it exists (onConflict in upsert depends on this)
-- First, find the constraint name
DO $$ 
DECLARE 
    constraint_name TEXT;
BEGIN 
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'public.post_metrics'::regclass AND contype = 'p';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.post_metrics DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add composite primary key
ALTER TABLE public.post_metrics ADD PRIMARY KEY (post_id, platform);

-- Update the RLS policy if it was tied to the ID specifically (though usually it's fine)
-- No changes needed for existing policies unless they were explicitly using the old 'id' column which might still exist
