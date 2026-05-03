import { supabase } from "@/integrations/supabase/client";

export type ActivityAction = "status_changed" | "media_uploaded" | "media_removed";

export interface ActivityRow {
  id: string;
  post_id: string;
  user_id: string;
  action: ActivityAction;
  details: Record<string, any>;
  created_at: string;
}

export const logActivity = async (
  postId: string,
  ownerId: string,
  action: ActivityAction,
  details: Record<string, any> = {}
) => {
  if (!postId || !ownerId) return;
  await supabase.from("post_activity").insert({
    post_id: postId,
    user_id: ownerId,
    action,
    details,
  });
};
