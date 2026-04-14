import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MobileMenuButton } from "./AppSidebar";

interface Props {
  onMenuOpen: () => void;
  onNewPost: () => void;
}

export const CalendarHeader = ({ onMenuOpen, onNewPost }: Props) => {
  const { currentMonth, setCurrentMonth, posts } = useContent();

  const monthPosts = posts.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });

  const published = monthPosts.filter(p => p.status === "Publicado").length;
  const total = monthPosts.length;
  const pct = total > 0 ? Math.round((published / total) * 100) : 0;

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-card gap-3 sm:gap-0">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <MobileMenuButton onClick={onMenuOpen} />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base sm:text-xl font-semibold text-foreground capitalize min-w-[140px] sm:min-w-[180px] text-center">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h1>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 ml-4">
          <span className="text-sm text-muted-foreground">
            {published}/{total}
          </span>
          <div className="w-24 lg:w-32 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
        </div>
      </div>

      <div className="flex sm:hidden items-center gap-3 w-full">
        <span className="text-xs text-muted-foreground">{published}/{total} publicados</span>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
      </div>

      <button
        onClick={onNewPost}
        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Plus className="h-4 w-4" />
        Novo Conteúdo
      </button>
    </header>
  );
};
