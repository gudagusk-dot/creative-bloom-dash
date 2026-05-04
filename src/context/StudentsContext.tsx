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
  created_at: string;
}

interface StudentsContextType {
  students: Student[];
  loading: boolean;
  createStudent: (data: { name: string; whatsapp?: string; seed?: boolean }) => Promise<Student | null>;
  updateStudent: (id: string, updates: Partial<Pick<Student, "name" | "slug" | "whatsapp">>) => Promise<{ error?: string }>;
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

const ensureUniqueSlug = async (base: string, ignoreId?: string): Promise<string> => {
  let candidate = base;
  let i = 1;
  // Try a few times; could collide with concurrent inserts
  while (true) {
    const { data } = await supabase
      .from("students")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
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

  useEffect(() => {
    refresh();
  }, [refresh]);

  // realtime
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`students:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students", filter: `owner_id=eq.${userId}` },
        () => refresh()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, refresh]);

  const createStudent: StudentsContextType["createStudent"] = useCallback(async ({ name, whatsapp, seed }) => {
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
      })
      .select("*")
      .single();
    if (error || !data) return null;
    const student = data as Student;

    if (seed) {
      const { initialPosts } = await import("@/data/content");
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

    await refresh();
    return student;
  }, [userId, refresh]);

  const updateStudent: StudentsContextType["updateStudent"] = useCallback(async (id, updates) => {
    const payload: any = { ...updates };
    if (payload.whatsapp !== undefined) {
      payload.whatsapp = payload.whatsapp ? sanitizeWhatsapp(payload.whatsapp) : null;
    }
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
    // delete posts and activity for this student first
    await supabase.from("content_posts").delete().eq("student_id", id);
    await supabase.from("post_activity").delete().eq("student_id", id);
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
