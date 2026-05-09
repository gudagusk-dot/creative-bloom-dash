import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./UserContext";
import { slugify, sanitizeWhatsapp } from "@/lib/slug";

export interface Student {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  whatsapp: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface StudentsContextType {
  students: Student[];
  loading: boolean;
  createStudent: (data: {
    name: string;
    whatsapp?: string;
    instagram_handle?: string;
    tiktok_handle?: string;
    seed?: boolean;
  }) => Promise<Student | null>;
  updateStudent: (
    id: string,
    updates: Partial<Pick<Student, "name" | "slug" | "whatsapp" | "instagram_handle" | "tiktok_handle">>,
  ) => Promise<{ error?: string }>;
  deleteStudent: (id: string) => Promise<void>;
  getBySlug: (slug: string) => Promise<Student | null>;
  refresh: () => Promise<void>;
}

const StudentsContext = createContext<StudentsContextType | null>(null);

export const useStudents = () => {
  const ctx = useContext(StudentsContext);
  if (!ctx) throw new Error("useStudents must be used within StudentsProvider");
  return ctx;
};

const sanitizeHandle = (raw?: string | null): string | null => {
  if (!raw) return null;
  let v = raw.trim();
  // strip URL prefix
  v = v.replace(/^https?:\/\/(www\.)?(instagram\.com|tiktok\.com)\//i, "");
  v = v.replace(/^@+/, "").replace(/\/$/, "").trim();
  return v.length ? v : null;
};

const ensureUniqueSlug = async (base: string, ignoreId?: string): Promise<string> => {
  let candidate = base;
  let i = 1;
  while (true) {
    const { data } = await supabase.from("students").select("id").eq("slug", candidate).maybeSingle();
    if (!data || data.id === ignoreId) return candidate;
    i += 1;
    candidate = `${base}-${i}`;
  }
};

export const StudentsProvider = ({ children }: { children: ReactNode }) => {
  const { userId } = useUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    setStudents((data || []) as Student[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  // realtime
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`students:${userId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "students", filter: `owner_id=eq.${userId}` },
        () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, refresh]);

  const createStudent: StudentsContextType["createStudent"] = useCallback(async ({ name, whatsapp, instagram_handle, tiktok_handle, seed }) => {
    if (!userId) return null;
    const trimmed = name.trim();
    if (!trimmed) return null;
    const slug = await ensureUniqueSlug(slugify(trimmed));
    const { data, error } = await supabase
      .from("students")
      .insert({
        owner_id: userId,
        name: trimmed,
        slug,
        whatsapp: whatsapp ? sanitizeWhatsapp(whatsapp) : null,
        instagram_handle: sanitizeHandle(instagram_handle),
        tiktok_handle: sanitizeHandle(tiktok_handle),
      })
      .select("*")
      .single();
    if (error || !data) return null;
    const student = data as Student;

    if (seed) {
      const { initialPosts, categoryConfig } = await import("@/data/content");
      // Seed categories ONLY when seeding posts.
      const catRows = Object.entries(categoryConfig).map(([name, cfg], i) => ({
        student_id: student.id,
        name,
        color: cfg.color,
        order_index: i,
      }));
      await supabase.from("student_categories").insert(catRows);
      const rows = initialPosts.map((p) => ({
        user_id: userId,
        student_id: student.id,
        date: p.date,
        format: p.format,
        title: p.title,
        category: p.category,
        network: p.network,
        status: p.status,
        notes: p.notes,
        script: p.script,
      }));
      await supabase.from("content_posts").insert(rows);
    }
    // When seed=false: NO categories, NO posts. Calendar starts truly empty.

    // Fire-and-forget: fetch IG/TikTok avatar + initial follower snapshot
    if (student.instagram_handle || student.tiktok_handle) {
      supabase.functions.invoke('fetch-follower-snapshot', { body: { student_id: student.id } })
        .then(() => refresh())
        .catch((e) => console.warn('[students] avatar fetch failed', e));
    }

    await refresh();
    return student;
  }, [userId, refresh]);

  const updateStudent: StudentsContextType["updateStudent"] = useCallback(async (id, updates) => {
    const payload: any = { ...updates };
    if (payload.whatsapp !== undefined) payload.whatsapp = payload.whatsapp ? sanitizeWhatsapp(payload.whatsapp) : null;
    if (payload.instagram_handle !== undefined) payload.instagram_handle = sanitizeHandle(payload.instagram_handle);
    if (payload.tiktok_handle !== undefined) payload.tiktok_handle = sanitizeHandle(payload.tiktok_handle);
    if (payload.slug) {
      const cleaned = slugify(payload.slug);
      const final = await ensureUniqueSlug(cleaned, id);
      payload.slug = final;
    }
    const { error } = await supabase.from("students").update(payload).eq("id", id);
    if (error) return { error: error.message };
    await refresh();
    return {};
  }, [refresh]);

  const deleteStudent = useCallback(async (id: string) => {
    await supabase.from("content_posts").delete().eq("student_id", id);
    await supabase.from("post_activity").delete().eq("student_id", id);
    await supabase.from("student_categories").delete().eq("student_id", id);
    await supabase.from("follower_snapshots").delete().eq("student_id", id);
    await supabase.from("post_metrics").delete().in("post_id", []); // best-effort; cascade by orphan
    await supabase.from("students").delete().eq("id", id);
    await refresh();
  }, [refresh]);

  const getBySlug = useCallback(async (slug: string): Promise<Student | null> => {
    const { data } = await supabase.from("students").select("*").eq("slug", slug).maybeSingle();
    return (data as Student) || null;
  }, []);

  return (
    <StudentsContext.Provider value={{ students, loading, createStudent, updateStudent, deleteStudent, getBySlug, refresh }}>
      {children}
    </StudentsContext.Provider>
  );
};
