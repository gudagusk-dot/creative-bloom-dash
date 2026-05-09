import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MessageCircle, Trash2, Share2, MoreVertical, Bell, Clock, BarChart3, Pencil } from "lucide-react";
import { Student } from "@/context/StudentsContext";
import { StudentStats } from "@/hooks/useStudentsStats";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  student: Student;
  stats?: StudentStats;
  onShare: (s: Student) => void;
  onDelete: (s: Student) => void;
  onEdit: (s: Student) => void;
}

export const StudentCard = ({ student, stats, onShare, onDelete, onEdit }: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const monthPct = stats && stats.monthTotal > 0 ? Math.round((stats.monthPublished / stats.monthTotal) * 100) : 0;
  const daysSince = stats?.lastActivity
    ? Math.floor((Date.now() - new Date(stats.lastActivity).getTime()) / 86400000)
    : null;

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 ease-soft relative group">
      <div className="flex items-start justify-between mb-4">
        <Link to={`/calendario/${student.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-soft group-hover:shadow-glow transition-shadow">
              <span className="font-display text-base font-medium text-primary-foreground">{student.name.charAt(0).toUpperCase()}</span>
            </div>
            {!!stats?.unseenCount && stats.unseenCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-card">
                {stats.unseenCount > 9 ? "9+" : stats.unseenCount}
              </span>
            )}
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
                <button onClick={() => { setMenuOpen(false); onEdit(student); }} className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-secondary flex items-center gap-2 transition-colors">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
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
          <span>{stats?.monthPublished ?? 0}/{stats?.monthTotal ?? 0} no mês</span>
          <span className="font-display text-sm font-medium text-foreground">{monthPct}%</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${monthPct}%` }} />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div className="rounded-xl bg-secondary/40 py-2">
            <div className="font-display text-base font-medium text-foreground">{stats?.pending ?? 0}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendentes</div>
          </div>
          <div className="rounded-xl bg-secondary/40 py-2">
            <div className="font-display text-base font-medium text-foreground">{stats?.published ?? 0}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Publicados</div>
          </div>
          <div className="rounded-xl bg-secondary/40 py-2">
            <div className="font-display text-base font-medium text-foreground">{stats?.media ?? 0}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Mídias</div>
          </div>
        </div>

        {stats?.nextPostTitle && (
          <div className="text-[11px] text-muted-foreground bg-secondary/30 rounded-lg p-2 mb-2 flex items-start gap-1.5">
            <CalendarDays className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
            <span className="line-clamp-1"><strong className="text-foreground">{stats.nextPostDate}:</strong> {stats.nextPostTitle}</span>
          </div>
        )}

        {daysSince !== null && (
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            Última atividade: {daysSince === 0 ? "hoje" : `há ${daysSince} dia${daysSince > 1 ? "s" : ""}`}
          </div>
        )}
      </Link>

      {student.whatsapp && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-4 mb-2">
          <MessageCircle className="h-3 w-3" /> {student.whatsapp}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/60">
        <Link
          to={`/calendario/${student.slug}`}
          className="flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
        >
          <CalendarDays className="h-3.5 w-3.5" /> Calendário
        </Link>
        <Link
          to={`/metricas/${student.slug}`}
          className="flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-soft"
        >
          <BarChart3 className="h-3.5 w-3.5" /> Métricas
        </Link>
      </div>
    </div>
  );
};
