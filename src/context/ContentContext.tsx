import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from "react";
import { ContentPost, Category, categoryConfig, FALLBACK_CATEGORY_COLOR } from "@/data/content";
import { supabase } from "@/integrations/supabase/client";

export interface StudentCategory {
  id: string;
  student_id: string;
  name: string;
  color: string;
  order_index: number;
}

interface ContentContextType {
  posts: ContentPost[];
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  selectedCategories: Category[];
  toggleCategory: (c: Category) => void;
  networkFilter: "all" | "Instagram" | "TikTok";
  setNetworkFilter: (n: "all" | "Instagram" | "TikTok") => void;
  updatePost: (id: string, updates: Partial<ContentPost>) => Promise<void>;
  addPost: (post: Omit<ContentPost, "id">) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  filteredPosts: ContentPost[];
  loading: boolean;
  studentId: string | null;
  ownerId: string | null;
  viewMode: "admin" | "student";
  // Categories per calendar
  categories: StudentCategory[];
  getCategoryColor: (name: string) => string;
  addCategory: (name: string, color: string) => Promise<StudentCategory | null>;
  updateCategory: (id: string, updates: Partial<Pick<StudentCategory, "name" | "color" | "order_index">>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const ContentContext = createContext<ContentContextType | null>(null);

export const useContent = () => {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
};

const mapRow = (p: any): ContentPost => ({
  id: p.id,
  date: p.date,
  format: p.format,
  title: p.title,
  category: p.category,
  network: p.network,
  status: p.status,
  notes: p.notes,
  script: p.script,
  media_urls: p.media_urls || [],
  published_url: p.published_url || "",
  student_notes: p.student_notes || "",
});

interface ProviderProps {
  children: ReactNode;
  studentId: string;
  ownerId: string;
  viewMode?: "admin" | "student";
}

export const ContentProvider = ({ children, studentId, ownerId, viewMode = "admin" }: ProviderProps) => {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [categories, setCategories] = useState<StudentCategory[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [networkFilter, setNetworkFilter] = useState<"all" | "Instagram" | "TikTok">("all");
  const [loading, setLoading] = useState(true);

  // Load posts + categories
  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [postsRes, catsRes] = await Promise.all([
        supabase.from("content_posts").select("*").eq("student_id", studentId),
        supabase.from("student_categories").select("*").eq("student_id", studentId).order("order_index"),
      ]);
      if (cancelled) return;
      setPosts((postsRes.data || []).map(mapRow));
      setCategories((catsRes.data || []) as StudentCategory[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  // Realtime: posts
  useEffect(() => {
    if (!studentId) return;
    const channel = supabase
      .channel(`content_posts:${studentId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "content_posts", filter: `student_id=eq.${studentId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = mapRow(payload.new);
            setPosts(prev => prev.some(p => p.id === row.id) ? prev : [...prev, row]);
          } else if (payload.eventType === "UPDATE") {
            const row = mapRow(payload.new);
            setPosts(prev => prev.map(p => p.id === row.id ? row : p));
          } else if (payload.eventType === "DELETE") {
            const oldId = (payload.old as any).id;
            setPosts(prev => prev.filter(p => p.id !== oldId));
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  // Realtime: categories
  useEffect(() => {
    if (!studentId) return;
    const channel = supabase
      .channel(`student_categories:${studentId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_categories", filter: `student_id=eq.${studentId}` },
        async () => {
          const { data } = await supabase.from("student_categories").select("*").eq("student_id", studentId).order("order_index");
          setCategories((data || []) as StudentCategory[]);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  const toggleCategory = useCallback((c: Category) => {
    setSelectedCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }, []);

  const updatePost = useCallback(async (id: string, updates: Partial<ContentPost>) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    await supabase.from("content_posts").update(updates as any).eq("id", id);
  }, []);

  const addPost = useCallback(async (post: Omit<ContentPost, "id">) => {
    if (!studentId || !ownerId) return;
    const { data } = await supabase
      .from("content_posts")
      .insert({ ...post, student_id: studentId, user_id: ownerId } as any)
      .select("*")
      .single();
    if (data) {
      const row = mapRow(data);
      setPosts(prev => prev.some(p => p.id === row.id) ? prev : [...prev, row]);
    }
  }, [studentId, ownerId]);

  const deletePost = useCallback(async (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    await supabase.from("content_posts").delete().eq("id", id);
  }, []);

  const colorMap = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach(c => m.set(c.name, c.color));
    return m;
  }, [categories]);

  const getCategoryColor = useCallback((name: string) => {
    if (!name) return FALLBACK_CATEGORY_COLOR;
    return colorMap.get(name) || categoryConfig[name]?.color || FALLBACK_CATEGORY_COLOR;
  }, [colorMap]);

  const addCategory = useCallback(async (name: string, color: string): Promise<StudentCategory | null> => {
    if (!studentId || !name.trim()) return null;
    const trimmed = name.trim();
    // dedupe locally
    const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const order_index = categories.length;
    const { data, error } = await supabase
      .from("student_categories")
      .insert({ student_id: studentId, name: trimmed, color, order_index })
      .select("*")
      .single();
    if (error || !data) return null;
    const row = data as StudentCategory;
    setCategories(prev => prev.some(c => c.id === row.id) ? prev : [...prev, row]);
    return row;
  }, [studentId, categories]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Pick<StudentCategory, "name" | "color" | "order_index">>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    await supabase.from("student_categories").update(updates).eq("id", id);
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    await supabase.from("student_categories").delete().eq("id", id);
  }, []);

  const filteredPosts = posts.filter(p => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
    if (networkFilter !== "all") {
      if (networkFilter === "Instagram" && p.network === "TikTok") return false;
      if (networkFilter === "TikTok" && p.network === "Instagram") return false;
    }
    return true;
  });

  return (
    <ContentContext.Provider value={{
      posts, currentMonth, setCurrentMonth,
      selectedCategories, toggleCategory,
      networkFilter, setNetworkFilter,
      updatePost, addPost, deletePost, filteredPosts, loading,
      studentId, ownerId, viewMode,
      categories, getCategoryColor, addCategory, updateCategory, deleteCategory,
    }}>
      {children}
    </ContentContext.Provider>
  );
};
