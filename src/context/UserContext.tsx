import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserContextType {
  userId: string | null;
  userName: string | null;
  notificationEmail: string | null;
  login: (name: string, email?: string) => Promise<void>;
  logout: () => void;
  updateNotificationSettings: (settings: { email?: string }) => Promise<void>;
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
  const [notificationEmail, setNotificationEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const stored = localStorage.getItem("simple_user");
      if (stored) {
        const { id, name } = JSON.parse(stored);
        setUserId(id);
        setUserName(name);
        
        // Fetch full user data including notification settings
        const { data } = await supabase
          .from("simple_users")
          .select("notification_email")
          .eq("id", id)
          .maybeSingle();
        
        if (data) {
          setNotificationEmail(data.notification_email);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = useCallback(async (name: string, email?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Try to find existing user
    const { data: existing } = await supabase
      .from("simple_users")
      .select("id, name, notification_email")
      .eq("name", trimmed)
      .maybeSingle();

    if (existing) {
      setUserId(existing.id);
      setUserName(existing.name);
      setNotificationEmail(existing.notification_email);
      localStorage.setItem("simple_user", JSON.stringify({ id: existing.id, name: existing.name }));
      return;
    }

    // Create new user
    const { data: created, error } = await supabase
      .from("simple_users")
      .insert({ name: trimmed, notification_email: email || null })
      .select("id, name, notification_email")
      .single();

    if (error) throw error;
    if (created) {
      setUserId(created.id);
      setUserName(created.name);
      setNotificationEmail(created.notification_email);
      localStorage.setItem("simple_user", JSON.stringify({ id: created.id, name: created.name }));
    }
  }, []);

  const logout = useCallback(() => {
    setUserId(null);
    setUserName(null);
    setNotificationEmail(null);
    localStorage.removeItem("simple_user");
  }, []);

  const updateNotificationSettings = useCallback(async (settings: { email?: string; whatsapp?: string }) => {
    if (!userId) return;
    
    const updates: any = {};
    if (settings.email !== undefined) updates.notification_email = settings.email;
    if (settings.whatsapp !== undefined) updates.notification_whatsapp = settings.whatsapp;

    const { error } = await supabase
      .from("simple_users")
      .update(updates)
      .eq("id", userId);
    
    if (error) throw error;
    
    if (settings.email !== undefined) setNotificationEmail(settings.email);
    if (settings.whatsapp !== undefined) setNotificationWhatsapp(settings.whatsapp);
  }, [userId]);

  return (
    <UserContext.Provider value={{ 
      userId, 
      userName, 
      notificationEmail, 
      notificationWhatsapp, 
      login, 
      logout, 
      updateNotificationSettings, 
      loading 
    }}>
      {children}
    </UserContext.Provider>
  );
};
