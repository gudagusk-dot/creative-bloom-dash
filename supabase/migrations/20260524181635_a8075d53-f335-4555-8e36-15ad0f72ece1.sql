-- Fix the webhook trigger function to be more robust
CREATE OR REPLACE FUNCTION public.trigger_notification_webhook()
RETURNS TRIGGER AS $$
DECLARE
  project_url TEXT := 'https://ltmwpwtocjjeeeufckqa.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bXdwd3RvY2pqZWVldWZja3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjYwOTEsImV4cCI6MjA5MTgwMjA5MX0.uNxnkcYUq1VCWDvf3AoDBjlwykidl9K_EXr_xAa_-Bw';
BEGIN
  -- Call the edge function using pg_net
  PERFORM net.http_post(
    url := project_url || '/functions/v1/send-post-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', anon_key,
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update notification trigger to include more fields
CREATE OR REPLACE FUNCTION public.handle_content_update_notification()
RETURNS TRIGGER AS $$
DECLARE
    admin_email TEXT;
    admin_notifications_enabled BOOLEAN;
BEGIN
    -- Only trigger if relevant fields changed
    IF (OLD.student_notes IS DISTINCT FROM NEW.student_notes OR 
        OLD.media_urls IS DISTINCT FROM NEW.media_urls OR
        OLD.status IS DISTINCT FROM NEW.status OR
        OLD.published_url IS DISTINCT FROM NEW.published_url OR
        OLD.instagram_published_url IS DISTINCT FROM NEW.instagram_published_url OR
        OLD.tiktok_published_url IS DISTINCT FROM NEW.tiktok_published_url) THEN
        
        -- Get the admin notification settings
        SELECT notification_email, email_notifications_enabled INTO admin_email, admin_notifications_enabled
        FROM public.simple_users 
        WHERE id = NEW.user_id;

        -- If email is configured and enabled, queue it
        IF (admin_notifications_enabled = true AND admin_email IS NOT NULL AND admin_email != '') THEN
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

-- Ensure the trigger is attached to content_posts
DROP TRIGGER IF EXISTS on_content_post_update_notify ON public.content_posts;
CREATE TRIGGER on_content_post_update_notify
AFTER UPDATE ON public.content_posts
FOR EACH ROW
EXECUTE FUNCTION handle_content_update_notification();
