import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserContextType {
  userId: string | null;
  userName: string | null;
  login: (name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("simple_user");
    if (stored) {
      const { id, name } = JSON.parse(stored);
      setUserId(id);
      setUserName(name);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Try to find existing user
    const { data: existing } = await supabase
      .from("simple_users")
      .select("id, name")
      .eq("name", trimmed)
      .maybeSingle();

    if (existing) {
      setUserId(existing.id);
      setUserName(existing.name);
      localStorage.setItem("simple_user", JSON.stringify({ id: existing.id, name: existing.name }));
      return;
    }

    // Create new user
    const { data: created, error } = await supabase
      .from("simple_users")
      .insert({ name: trimmed })
      .select("id, name")
      .single();

    if (error) throw error;
    if (created) {
      setUserId(created.id);
      setUserName(created.name);
      localStorage.setItem("simple_user", JSON.stringify({ id: created.id, name: created.name }));
    }
  }, []);

  const logout = useCallback(() => {
    setUserId(null);
    setUserName(null);
    localStorage.removeItem("simple_user");
  }, []);

  return (
    <UserContext.Provider value={{ userId, userName, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};
