import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { Category, Format, SocialNetwork } from "@/data/content";

export interface Template {
  id: string;
  owner_id: string;
  name: string;
  category: Category;
  format: Format;
  network: SocialNetwork;
  default_title: string;
  default_script: string;
}

export const useTemplates = () => {
  const { userId } = useUser();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!userId) { setTemplates([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("content_templates")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    setTemplates((data as Template[]) || []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [userId]);

  const create = async (t: Omit<Template, "id" | "owner_id">) => {
    if (!userId) return;
    await supabase.from("content_templates").insert({ ...t, owner_id: userId });
    await refresh();
  };
  const remove = async (id: string) => {
    await supabase.from("content_templates").delete().eq("id", id);
    await refresh();
  };

  return { templates, loading, create, remove, refresh };
};
