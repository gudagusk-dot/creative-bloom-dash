import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";

export interface StudentStats {
  total: number;
  published: number;
  pending: number;
  media: number;
  monthTotal: number;
  monthPublished: number;
  nextPostDate: string | null;
  nextPostTitle: string | null;
  lastActivity: string | null;
  unseenCount: number;
}

const today = () => new Date().toISOString().slice(0, 10);
const monthRange = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
};

export const useStudentsStats = (studentIds: string[]) => {
  const { userId } = useUser();
  const [stats, setStats] = useState<Record<string, StudentStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || studentIds.length === 0) { setStats({}); setLoading(false); return; }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const [{ data: posts }, { data: act }, { data: visits }] = await Promise.all([
        supabase.from("content_posts").select("student_id, status, date, title, media_urls").in("student_id", studentIds),
        supabase.from("post_activity").select("student_id, created_at").in("student_id", studentIds).order("created_at", { ascending: false }),
        supabase.from("admin_visits").select("student_id, last_seen_at").eq("owner_id", userId).in("student_id", studentIds),
      ]);
      if (cancelled) return;

      const visitMap = new Map<string, string>();
      (visits || []).forEach((v: any) => visitMap.set(v.student_id, v.last_seen_at));

      const range = monthRange();
      const t = today();
      const out: Record<string, StudentStats> = {};
      studentIds.forEach(id => {
        const ps = (posts || []).filter((p: any) => p.student_id === id);
        const monthPs = ps.filter((p: any) => p.date >= range.start && p.date <= range.end);
        const future = ps.filter((p: any) => p.date >= t && p.status !== "Publicado").sort((a: any, b: any) => a.date.localeCompare(b.date));
        const lastSeen = visitMap.get(id);
        const acts = (act || []).filter((a: any) => a.student_id === id);
        const unseen = lastSeen ? acts.filter((a: any) => a.created_at > lastSeen).length : acts.length;
        out[id] = {
          total: ps.length,
          published: ps.filter((p: any) => p.status === "Publicado").length,
          pending: ps.filter((p: any) => p.status !== "Publicado").length,
          media: ps.reduce((acc: number, p: any) => acc + (p.media_urls?.length || 0), 0),
          monthTotal: monthPs.length,
          monthPublished: monthPs.filter((p: any) => p.status === "Publicado").length,
          nextPostDate: future[0]?.date || null,
          nextPostTitle: future[0]?.title || null,
          lastActivity: acts[0]?.created_at || null,
          unseenCount: unseen,
        };
      });
      setStats(out);
      setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [userId, studentIds.join(",")]);

  return { stats, loading };
};

export const markStudentSeen = async (ownerId: string, studentId: string) => {
  await supabase.from("admin_visits").upsert(
    { owner_id: ownerId, student_id: studentId, last_seen_at: new Date().toISOString() },
    { onConflict: "owner_id,student_id" }
  );
};
