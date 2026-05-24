-- Add notification fields to simple_users
ALTER TABLE public.simple_users 
ADD COLUMN IF NOT EXISTS notification_email TEXT,
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

-- Ensure simple_users has RLS
ALTER TABLE public.simple_users ENABLE ROW LEVEL SECURITY;

-- Allow users to update their own notification email
-- Since simple_users is identifying users by name/localStorage in the app, 
-- we need to make sure the policies allow the operations.
-- The current app seems to use name as a key.

CREATE POLICY "Allow individual updates to simple_users" 
ON public.simple_users 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read of simple_users" 
ON public.simple_users 
FOR SELECT 
USING (true);

-- Function to handle content update notifications
CREATE OR REPLACE FUNCTION public.handle_content_update_notification()
RETURNS TRIGGER AS $$
DECLARE
    admin_email TEXT;
BEGIN
    -- Only trigger if student_notes or media_urls or status changed
    IF (OLD.student_notes IS DISTINCT FROM NEW.student_notes OR 
        OLD.media_urls IS DISTINCT FROM NEW.media_urls OR
        OLD.status IS DISTINCT FROM NEW.status) THEN
        
        -- Get the admin email from simple_users
        SELECT notification_email INTO admin_email 
        FROM public.simple_users 
        WHERE id = NEW.user_id 
        AND email_notifications_enabled = true;

        IF admin_email IS NOT NULL AND admin_email != '' THEN
            -- In a real production app, we'd call an edge function here
            -- For Lovable Cloud, we can use a HTTP request or just log it 
            -- and let the Edge Function be triggered by a Webhook.
            -- We'll use the 'supabase_functions' extension if available, or just a custom table for queueing.
            
            -- For now, let's create a notification queue table
            INSERT INTO public.post_notifications (
                post_id, 
                user_id, 
                recipient_email, 
                type,
                student_name
            )
            SELECT 
                NEW.id, 
                NEW.user_id, 
                admin_email, 
                'update',
                s.name
            FROM public.students s
            WHERE s.id = NEW.student_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.post_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.content_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.simple_users(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    student_name TEXT,
    type TEXT NOT NULL,
    sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.post_notifications ENABLE ROW LEVEL SECURITY;

-- Trigger for content_posts
DROP TRIGGER IF EXISTS on_content_post_update_notify ON public.content_posts;
CREATE TRIGGER on_content_post_update_notify
AFTER UPDATE ON public.content_posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_content_update_notification();
