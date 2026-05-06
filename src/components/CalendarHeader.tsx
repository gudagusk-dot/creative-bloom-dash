import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  onNewPost?: () => void;
}

export const CalendarHeader = ({ onNewPost }: Props) => {
  const { currentMonth, setCurrentMonth, posts, viewMode } = useContent();

  const monthPosts = posts.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });

  const published = monthPosts.filter(p => p.status === "Publicado").length;
  const total = monthPosts.length;
  const pct = total > 0 ? Math.round((published / total) * 100) : 0;
  const isAdmin = viewMode === "admin";

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-border/60 bg-card gap-3 sm:gap-0">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="font-display text-xl sm:text-2xl font-light text-foreground capitalize min-w-[160px] sm:min-w-[200px] text-center tracking-tight">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h1>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 ml-4 pl-4 border-l border-border/60">
          <span className="text-xs text-muted-foreground font-medium">{published}/{total}</span>
          <div className="w-24 lg:w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-display font-medium text-foreground">{pct}%</span>
        </div>
      </div>

      <div className="flex sm:hidden items-center gap-3 w-full">
        <span className="text-xs text-muted-foreground">{published}/{total} publicados</span>
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-display font-medium text-foreground">{pct}%</span>
      </div>

      {isAdmin && onNewPost && (
        <button
          onClick={onNewPost}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-primary text-primary-foreground rounded-xl text-sm font-medium shadow-soft hover:shadow-soft-md hover:-translate-y-0.5 transition-all ease-soft"
        >
          <Plus className="h-4 w-4" />
          Novo Conteúdo
        </button>
      )}
    </header>
  );
};
