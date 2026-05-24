-- Enable the pg_net extension to allow HTTP requests from triggers
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to call the edge function
CREATE OR REPLACE FUNCTION public.trigger_notification_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function using pg_net
  -- Replace with your actual project reference ID if needed, 
  -- but usually we can use the local path if within the same project.
  -- We'll use the external URL for reliability.
  PERFORM net.http_post(
    url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-post-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'apikey'
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  
  -- Alternatively, if the host header isn't reliable, 
  -- we can just rely on the user deploying it and Supabase handling the internal routing.
  -- For Lovable, we often use a table-based queue and a background process, 
  -- but a direct trigger is faster for "immediate" notifications.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on INSERT to post_notifications
DROP TRIGGER IF EXISTS tr_on_notification_insert ON public.post_notifications;
CREATE TRIGGER tr_on_notification_insert
AFTER INSERT ON public.post_notifications
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notification_webhook();
