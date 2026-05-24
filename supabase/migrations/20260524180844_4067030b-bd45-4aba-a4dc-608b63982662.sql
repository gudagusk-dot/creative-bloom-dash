-- Add WhatsApp fields to simple_users
ALTER TABLE public.simple_users 
ADD COLUMN IF NOT EXISTS notification_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN DEFAULT false;

-- Add recipient_whatsapp to notifications queue
ALTER TABLE public.post_notifications
ADD COLUMN IF NOT EXISTS recipient_whatsapp TEXT;

-- Update notification trigger to include WhatsApp
CREATE OR REPLACE FUNCTION public.handle_content_update_notification()
RETURNS TRIGGER AS $$
DECLARE
    admin_email TEXT;
    admin_whatsapp TEXT;
BEGIN
    -- Only trigger if student_notes or media_urls or status changed
    IF (OLD.student_notes IS DISTINCT FROM NEW.student_notes OR 
        OLD.media_urls IS DISTINCT FROM NEW.media_urls OR
        OLD.status IS DISTINCT FROM NEW.status) THEN
        
        -- Get the admin notification settings
        SELECT notification_email, notification_whatsapp INTO admin_email, admin_whatsapp
        FROM public.simple_users 
        WHERE id = NEW.user_id;

        -- If at least one notification channel is active, queue it
        IF (admin_email IS NOT NULL AND admin_email != '') OR (admin_whatsapp IS NOT NULL AND admin_whatsapp != '') THEN
            INSERT INTO public.post_notifications (
                post_id, 
                user_id, 
                recipient_email, 
                recipient_whatsapp,
                type,
                student_name
            )
            SELECT 
                NEW.id, 
                NEW.user_id, 
                admin_email, 
                admin_whatsapp,
                'update',
                s.name
            FROM public.students s
            WHERE s.id = NEW.student_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
