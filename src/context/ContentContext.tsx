import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { ContentPost, Category, initialPosts } from "@/data/content";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./UserContext";

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
});

interface ProviderProps {
  children: ReactNode;
  /** If provided, overrides the logged-in user. Used by /aluno/:ownerId */
  ownerIdOverride?: string;
  viewMode?: "admin" | "student";
}

export const ContentProvider = ({ children, ownerIdOverride, viewMode = "admin" }: ProviderProps) => {
  const { userId } = useUser();
  const ownerId = ownerIdOverride || userId;

  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1));
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [networkFilter, setNetworkFilter] = useState<"all" | "Instagram" | "TikTok">("all");
  const [loading, setLoading] = useState(true);

  // Load posts from DB
  useEffect(() => {
    if (!ownerId) return;
    const loadPosts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("content_posts")
        .select("*")
        .eq("user_id", ownerId);

      if (data && data.length > 0) {
        setPosts(data.map(mapRow));
      } else if (viewMode === "admin") {
        // Seed initial posts for new admin only
        const toInsert = initialPosts.map(p => ({
          user_id: ownerId,
          date: p.date,
          format: p.format,
          title: p.title,
          category: p.category,
          network: p.network,
          status: p.status,
          notes: p.notes,
          script: p.script,
        }));
        const { data: inserted } = await supabase
          .from("content_posts")
          .insert(toInsert)
          .select("*");
        if (inserted) setPosts(inserted.map(mapRow));
      } else {
        setPosts([]);
      }
      setLoading(false);
    };
    loadPosts();
  }, [ownerId, viewMode]);

  // Realtime subscription
  useEffect(() => {
    if (!ownerId) return;
    const channel = supabase
      .channel(`content_posts:${ownerId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "content_posts", filter: `user_id=eq.${ownerId}` },
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
  }, [ownerId]);

  const toggleCategory = useCallback((c: Category) => {
    setSelectedCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  }, []);

  const updatePost = useCallback(async (id: string, updates: Partial<ContentPost>) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    await supabase.from("content_posts").update(updates).eq("id", id);
  }, []);

  const addPost = useCallback(async (post: Omit<ContentPost, "id">) => {
    if (!ownerId) return;
    const { data } = await supabase
      .from("content_posts")
      .insert({ ...post, user_id: ownerId })
      .select("*")
      .single();
    if (data) {
      const row = mapRow(data);
      setPosts(prev => prev.some(p => p.id === row.id) ? prev : [...prev, row]);
    }
  }, [ownerId]);

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
      ownerId, viewMode,
    }}>
      {children}
    </ContentContext.Provider>
  );
};
