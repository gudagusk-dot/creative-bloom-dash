import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, LayoutGrid, List, FileText, Download, BrainCircuit, Globe, EyeOff, Check, Loader2, AlertCircle, Menu } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarView } from "./CalendarGrid";
import { TemplatesDialog } from "./TemplatesDialog";
import { CoachDialog } from "./CoachDialog";
import { exportCalendarPDF } from "@/lib/pdfExport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStudents } from "@/context/StudentsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Props {
  onNewPost?: () => void;
  view: CalendarView;
  onChangeView: (v: CalendarView) => void;
  studentName?: string;
}

export const CalendarHeader = ({ onNewPost, view, onChangeView, studentName }: Props) => {
  const { currentMonth, setCurrentMonth, posts, viewMode, getCategoryColor, studentId } = useContent();
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const { students, updateStudent } = useStudents();
  
  const currentStudent = students.find((s: any) => s.id === studentId);
  const isCalendarPublished = currentStudent?.calendar_published !== false;
  const monthPosts = posts.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });

  const hasUnpublishedChanges = monthPosts.some(p => !p.published);


  const publishedCount = monthPosts.filter(p => p.status === "Publicado").length;
  const total = monthPosts.length;
  const pct = total > 0 ? Math.round((publishedCount / total) * 100) : 0;
  const isAdmin = viewMode === "admin";

  const handlePublish = async () => {
    if (!studentId || publishing) return;
    setPublishing(true);
    try {
      // 1. Mark only current month's posts as published
      const idsToPublish = monthPosts.filter(p => !p.published).map(p => p.id);
      
      if (idsToPublish.length > 0) {
        const { error: postError } = await supabase
          .from("content_posts")
          .update({ published: true })
          .in("id", idsToPublish);
        
        if (postError) throw postError;
      }


      // 2. Mark calendar as published
      await updateStudent(studentId, { calendar_published: true } as any);
      
      toast.success("Calendário e alterações publicados!");
    } catch (e) {
      toast.error("Erro ao publicar");
    } finally {
      setPublishing(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      let metricsByPostId: Record<string, any> | undefined;
      const ids = monthPosts.map(p => p.id);
      if (ids.length) {
        const { data: m } = await supabase.from("post_metrics").select("*").in("post_id", ids);
        if (m && m.length) {
          metricsByPostId = {};
          m.forEach((row: any) => { metricsByPostId![row.post_id] = row; });
        }
      }
      await exportCalendarPDF({ monthDate: currentMonth, posts: monthPosts, studentName, getCategoryColor, metricsByPostId });
      toast.success("PDF gerado!");
    } catch (e) {
      toast.error("Erro ao gerar PDF");
    } finally { setExporting(false); }
  };

  return (
    <div className="flex flex-col bg-card border-b border-border/60">
      {/* Warning Banner for Admin */}
      {isAdmin && hasUnpublishedChanges && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <p className="text-xs font-medium text-amber-700">
            Você possui alterações que ainda não foram publicadas para o aluno.
          </p>
          <button 
            onClick={handlePublish}
            disabled={publishing}
            className="text-xs font-bold text-amber-800 hover:underline ml-2 flex items-center gap-1"
          >
            {publishing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Publicar agora"}
          </button>
        </div>
      )}

      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-5 gap-3 sm:gap-0">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center">
              <h1 className="font-display text-xl sm:text-2xl font-light text-foreground capitalize min-w-[160px] sm:min-w-[200px] text-center tracking-tight">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h1>
              {!isSameMonth(currentMonth, new Date()) && (
                <button 
                  onClick={() => {
                    const d = new Date();
                    d.setDate(1);
                    d.setHours(0, 0, 0, 0);
                    setCurrentMonth(d);
                  }}
                  className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline mt-0.5 animate-in fade-in slide-in-from-top-1"
                >
                  Voltar para hoje
                </button>
              )}
            </div>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 ml-4 pl-4 border-l border-border/60">
            <span className="text-xs text-muted-foreground font-medium">{publishedCount}/{total}</span>
            <div className="w-24 lg:w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-display font-medium text-foreground">{pct}%</span>
          </div>
        </div>

        {/* Mobile Stats & Menu */}
        <div className="flex sm:hidden items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{publishedCount}/{total} publicados</span>
            <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 bg-secondary rounded-lg text-secondary-foreground">
                    <Menu className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={onNewPost} className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Conteúdo
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCoachOpen(true)} className="gap-2">
                    <BrainCircuit className="h-4 w-4" /> Brenda IA
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTemplatesOpen(true)} className="gap-2">
                    <FileText className="h-4 w-4" /> Templates
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExport} disabled={exporting} className="gap-2">
                    <Download className="h-4 w-4" /> {exporting ? "Gerando PDF..." : "Exportar PDF"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handlePublish} 
                    disabled={publishing}
                    className={`gap-2 font-medium ${hasUnpublishedChanges ? "text-primary" : ""}`}
                  >
                    {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : hasUnpublishedChanges ? <Globe className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    {hasUnpublishedChanges ? "Publicar Alterações" : isCalendarPublished ? "Calendário Publicado" : "Publicar Calendário"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop View Selectors */}
          <div className="hidden sm:flex items-center bg-secondary rounded-lg p-0.5">
            {([
              ["month", CalendarDays, "Mês"],
              ["week", LayoutGrid, "Semana"],
              ["list", List, "Lista"],
            ] as const).map(([k, Icon, label]) => (
              <button
                key={k}
                onClick={() => onChangeView(k)}
                title={label}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  view === k ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Desktop Admin Actions */}
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setCoachOpen(true)}
                title="Brenda IA"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-primary/10 to-accent/10 text-primary hover:from-primary/20 hover:to-accent/20 transition-colors border border-primary/20"
              >
                <BrainCircuit className="h-3.5 w-3.5" /> Brenda IA
              </button>
              <button
                onClick={() => setTemplatesOpen(true)}
                title="Templates"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
              >
                <FileText className="h-3.5 w-3.5" /> Templates
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                title="Exportar PDF"
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> {exporting ? "Gerando…" : "PDF"}
              </button>

              <button
                onClick={handlePublish}
                disabled={publishing}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-soft transition-all ease-soft ${
                  hasUnpublishedChanges
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-4 ring-primary/10"
                    : isCalendarPublished 
                      ? "bg-secondary text-secondary-foreground opacity-70 cursor-default" 
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : hasUnpublishedChanges ? (
                  <Globe className="h-4 w-4 animate-pulse" />
                ) : isCalendarPublished ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                {hasUnpublishedChanges ? "Publicar Alterações" : isCalendarPublished ? "Publicado" : "Publicar p/ Aluno"}
              </button>

              {onNewPost && (
                <button
                  onClick={onNewPost}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-primary text-primary-foreground rounded-xl text-sm font-medium shadow-soft hover:shadow-soft-md hover:-translate-y-0.5 transition-all ease-soft"
                >
                  <Plus className="h-4 w-4" />
                  Novo Conteúdo
                </button>
              )}
            </div>
          )}
        </div>

        {isAdmin && <TemplatesDialog open={templatesOpen} onClose={() => setTemplatesOpen(false)} />}
        {isAdmin && <CoachDialog open={coachOpen} onClose={() => setCoachOpen(false)} studentName={studentName} />}

        {/* Floating Brenda IA button — always visible for admin */}
        {isAdmin && !coachOpen && (
          <button
            onClick={() => setCoachOpen(true)}
            title="Abrir Brenda IA"
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-soft-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <span className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75 animate-ping" />
              <BrainCircuit className="h-5 w-5 relative" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Brenda IA</span>
          </button>
        )}
      </header>
    </div>
  );
};
