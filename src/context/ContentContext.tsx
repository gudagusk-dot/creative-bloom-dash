import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { ContentPost, Category, SocialNetwork, initialPosts } from "@/data/content";

interface ContentContextType {
  posts: ContentPost[];
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  selectedCategories: Category[];
  toggleCategory: (c: Category) => void;
  networkFilter: "all" | "Instagram" | "TikTok";
  setNetworkFilter: (n: "all" | "Instagram" | "TikTok") => void;
  updatePost: (id: string, updates: Partial<ContentPost>) => void;
  addPost: (post: Omit<ContentPost, "id">) => void;
  deletePost: (id: string) => void;
  filteredPosts: ContentPost[];
}

const ContentContext = createContext<ContentContextType | null>(null);

export const useContent = () => {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
};

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<ContentPost[]>(initialPosts);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1));
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [networkFilter, setNetworkFilter] = useState<"all" | "Instagram" | "TikTok">("all");

  const toggleCategory = useCallback((c: Category) => {
    setSelectedCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  }, []);

  const updatePost = useCallback((id: string, updates: Partial<ContentPost>) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const addPost = useCallback((post: Omit<ContentPost, "id">) => {
    const id = crypto.randomUUID();
    setPosts(prev => [...prev, { ...post, id }]);
  }, []);

  const deletePost = useCallback((id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
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
      updatePost, addPost, deletePost, filteredPosts,
    }}>
      {children}
    </ContentContext.Provider>
  );
};
