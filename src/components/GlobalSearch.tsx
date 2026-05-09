import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { FALLBACK_CATEGORY_COLOR } from "@/data/content";

interface PostHit {
  id: string;
  title: string;
  date: string;
  category: string;
  format: string;
  status: string;
  student_id: string;
}
interface StudentLite { id: string; name: string; slug: string; }

export const GlobalSearch = () => {
  const { userId } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<PostHit[]>([]);
  const [students, setStudents] = useState<Record<string, StudentLite>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || !userId) return;
    const run = async () => {
      setLoading(true);
      const { data: stu } = await supabase
        .from("students").select("id, name, slug").eq("owner_id", userId);
      const map: Record<string, StudentLite> = {};
      (stu || []).forEach((s: any) => { map[s.id] = s; });
      setStudents(map);

      const { data } = await supabase
        .from("content_posts")
        .select("id, title, date, category, format, status, student_id")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(500);
      setPosts((data as PostHit[]) || []);
      setLoading(false);
    };
    run();
  }, [open, userId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts.slice(0, 30);
    return posts
      .filter(p => p.title.toLowerCase().includes(q) || (students[p.student_id]?.name || "").toLowerCase().includes(q))
      .slice(0, 50);
  }, [query, posts, students]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-card border border-border/60 rounded-2xl shadow-soft-xl overflow-hidden animate-scale-in"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar posts em todos os alunos…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">ESC</kbd>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="p-4 text-xs text-muted-foreground text-center">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-xs text-muted-foreground text-center italic">Nenhum resultado.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map(p => {
                const s = students[p.student_id];
                const color = (categoryConfig as any)[p.category]?.color || "#999";
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => {
                        if (s) {
                          setOpen(false);
                          navigate(`/calendario/${s.slug}`);
                        }
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors flex items-start gap-3"
                    >
                      <span className="w-1 self-stretch rounded-full" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-white" style={{ backgroundColor: color }}>{p.format}</span>
                          {s && <span className="text-[10px] text-muted-foreground">{s.name}</span>}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{p.date}</span>
                        </div>
                        <p className="text-sm text-foreground line-clamp-1">{p.title}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="px-4 py-2 text-[10px] text-muted-foreground border-t border-border bg-muted/20">
          Atalho: <kbd className="bg-secondary px-1 rounded">⌘ K</kbd> / <kbd className="bg-secondary px-1 rounded">Ctrl K</kbd>
        </div>
      </div>
    </div>
  );
};
