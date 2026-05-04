import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { ContentPost, Category } from "@/data/content";
import { supabase } from "@/integrations/supabase/client";

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
  /** owner id (admin) — used as fallback user_id on inserts */
  ownerId: string;
  viewMode?: "admin" | "student";
}

export const ContentProvider = ({ children, studentId, ownerId, viewMode = "admin" }: ProviderProps) => {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1));
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [networkFilter, setNetworkFilter] = useState<"all" | "Instagram" | "TikTok">("all");
  const [loading, setLoading] = useState(true);

  // Load posts from DB
  useEffect(() => {
    if (!studentId) return;
    const loadPosts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("content_posts")
        .select("*")
        .eq("student_id", studentId);

      setPosts((data || []).map(mapRow));
      setLoading(false);
    };
    loadPosts();
  }, [studentId]);

  // Realtime subscription
  useEffect(() => {
    if (!studentId) return;
    const channel = supabase
      .channel(`content_posts:${studentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "content_posts", filter: `student_id=eq.${studentId}` },
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
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [studentId]);

  const toggleCategory = useCallback((c: Category) => {
    setSelectedCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
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
    }}>
      {children}
    </ContentContext.Provider>
  );
};
