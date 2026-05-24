-- Remove WhatsApp fields from simple_users
ALTER TABLE public.simple_users 
DROP COLUMN IF EXISTS notification_whatsapp,
DROP COLUMN IF EXISTS whatsapp_notifications_enabled;

-- Remove recipient_whatsapp from notifications queue
ALTER TABLE public.post_notifications
DROP COLUMN IF EXISTS recipient_whatsapp;

-- Update notification trigger to focus only on email
CREATE OR REPLACE FUNCTION public.handle_content_update_notification()
RETURNS TRIGGER AS $$
DECLARE
    admin_email TEXT;
BEGIN
    -- Only trigger if student_notes or media_urls or status changed
    IF (OLD.student_notes IS DISTINCT FROM NEW.student_notes OR 
        OLD.media_urls IS DISTINCT FROM NEW.media_urls OR
        OLD.status IS DISTINCT FROM NEW.status) THEN
        
        -- Get the admin notification email
        SELECT notification_email INTO admin_email
        FROM public.simple_users 
        WHERE id = NEW.user_id;

        -- If email is configured, queue it
        IF (admin_email IS NOT NULL AND admin_email != '') THEN
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
