import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { ContentPost, Category, SocialNetwork, initialPosts } from "@/data/content";
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
}

const ContentContext = createContext<ContentContextType | null>(null);

export const useContent = () => {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
};

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  const { userId } = useUser();
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1));
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [networkFilter, setNetworkFilter] = useState<"all" | "Instagram" | "TikTok">("all");
  const [loading, setLoading] = useState(true);

  // Load posts from DB
  useEffect(() => {
    if (!userId) return;
    const loadPosts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("content_posts")
        .select("*")
        .eq("user_id", userId);

      if (data && data.length > 0) {
        setPosts(data.map(p => ({
          id: p.id,
          date: p.date,
          format: p.format as any,
          title: p.title,
          category: p.category as any,
          network: p.network as any,
          status: p.status as any,
          notes: p.notes,
          script: p.script,
        })));
      } else {
        // Seed initial posts for new user
        const toInsert = initialPosts.map(p => ({
          user_id: userId,
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
        if (inserted) {
          setPosts(inserted.map(p => ({
            id: p.id,
            date: p.date,
            format: p.format as any,
            title: p.title,
            category: p.category as any,
            network: p.network as any,
            status: p.status as any,
            notes: p.notes,
            script: p.script,
          })));
        }
      }
      setLoading(false);
    };
    loadPosts();
  }, [userId]);

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
    if (!userId) return;
    const { data, error } = await supabase
      .from("content_posts")
      .insert({ ...post, user_id: userId })
      .select("*")
      .single();
    if (data) {
      setPosts(prev => [...prev, {
        id: data.id,
        date: data.date,
        format: data.format as any,
        title: data.title,
        category: data.category as any,
        network: data.network as any,
        status: data.status as any,
        notes: data.notes,
        script: data.script,
      }]);
    }
  }, [userId]);

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
    }}>
      {children}
    </ContentContext.Provider>
  );
};
