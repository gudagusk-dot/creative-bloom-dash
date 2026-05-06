import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MessageCircle, Trash2, Share2, MoreVertical } from "lucide-react";
import { Student } from "@/context/StudentsContext";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  student: Student;
  onShare: (s: Student) => void;
  onDelete: (s: Student) => void;
}

interface Stats { total: number; published: number; pending: number; media: number; lastActivity: string | null; }

export const StudentCard = ({ student, onShare, onDelete }: Props) => {
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, pending: 0, media: 0, lastActivity: null });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: posts } = await supabase
        .from("content_posts")
        .select("status, media_urls")
        .eq("student_id", student.id);
      const { data: act } = await supabase
        .from("post_activity")
        .select("created_at")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!active) return;
      const total = posts?.length || 0;
      const published = posts?.filter((p: any) => p.status === "Publicado").length || 0;
      const media = posts?.reduce((acc: number, p: any) => acc + (p.media_urls?.length || 0), 0) || 0;
      setStats({
        total,
        published,
        pending: total - published,
        media,
        lastActivity: act?.[0]?.created_at || null,
      });
    };
    load();
    return () => { active = false; };
  }, [student.id]);

  const pct = stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0;

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 ease-soft relative group">
      <div className="flex items-start justify-between mb-4">
        <Link to={`/calendario/${student.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-soft group-hover:shadow-glow transition-shadow">
            <span className="font-display text-base font-medium text-primary-foreground">{student.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-medium text-foreground truncate tracking-tight">{student.name}</h3>
            <p className="text-[11px] text-muted-foreground truncate">/aluno/{student.slug}</p>
          </div>
        </Link>

        <div className="relative">
          <button onClick={() => setMenuOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-xl shadow-soft-lg z-20 py-1 animate-scale-in origin-top-right">
                <button onClick={() => { setMenuOpen(false); onShare(student); }} className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-secondary flex items-center gap-2 transition-colors">
                  <Share2 className="h-3.5 w-3.5" /> Compartilhar
                </button>
                <button onClick={() => { setMenuOpen(false); onDelete(student); }} className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Link to={`/calendario/${student.slug}`} className="block">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>{stats.published}/{stats.total} publicados</span>
          <span className="font-display text-sm font-medium text-foreground">{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-secondary/40 py-2">
            <div className="font-display text-base font-medium text-foreground">{stats.pending}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendentes</div>
          </div>
          <div className="rounded-xl bg-secondary/40 py-2">
            <div className="font-display text-base font-medium text-foreground">{stats.published}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Publicados</div>
          </div>
          <div className="rounded-xl bg-secondary/40 py-2">
            <div className="font-display text-base font-medium text-foreground">{stats.media}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Mídias</div>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/60">
        {student.whatsapp && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MessageCircle className="h-3 w-3" /> {student.whatsapp}
          </span>
        )}
        <Link to={`/calendario/${student.slug}`} className="ml-auto flex items-center gap-1 text-[11px] text-primary font-medium hover:gap-1.5 transition-all">
          <CalendarDays className="h-3 w-3" /> Abrir calendário →
        </Link>
      </div>
    </div>
  );
};
