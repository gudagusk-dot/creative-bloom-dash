import { supabase } from "@/integrations/supabase/client";

export type ActivityAction = "status_changed" | "media_uploaded" | "media_removed" | "link_added" | "note_added";

export interface ActivityRow {
  id: string;
  post_id: string;
  user_id: string;
  student_id: string | null;
  action: ActivityAction;
  details: Record<string, any>;
  created_at: string;
}

export const logActivity = async (
  postId: string,
  ownerId: string,
  studentId: string | null,
  action: ActivityAction,
  details: Record<string, any> = {}
) => {
  if (!postId || !ownerId) return;
  await supabase.from("post_activity").insert({
    post_id: postId,
    user_id: ownerId,
    student_id: studentId,
    action,
    details,
  });
};
