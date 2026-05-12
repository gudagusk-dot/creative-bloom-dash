-- First, ensure the id column exists if we need it, but we are moving to composite PK
-- Drop the existing primary key constraint if it exists
DO $$ 
DECLARE 
    pk_name TEXT;
BEGIN 
    SELECT conname INTO pk_name
    FROM pg_constraint 
    WHERE conrelid = 'public.post_metrics'::regclass AND contype = 'p';

    IF pk_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.post_metrics DROP CONSTRAINT ' || pk_name;
    END IF;
END $$;

-- Drop any existing unique constraint on post_id if it's not the PK
DO $$ 
DECLARE 
    uk_name TEXT;
BEGIN 
    SELECT conname INTO uk_name
    FROM pg_constraint 
    WHERE conrelid = 'public.post_metrics'::regclass AND contype = 'u' AND conkey = (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid = 'public.post_metrics'::regclass AND attname = 'post_id');

    IF uk_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.post_metrics DROP CONSTRAINT ' || uk_name;
    END IF;
END $$;

-- Specifically drop the unique index that might be causing the conflict if it's not a constraint
DROP INDEX IF EXISTS post_metrics_post_id_key;

-- Now add the composite primary key correctly
ALTER TABLE public.post_metrics ADD PRIMARY KEY (post_id, platform);
