import { useContent } from "@/context/ContentContext";
import { format, isToday, isSameDay, addDays, isBefore, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { ContentPost } from "@/data/content";

export const StudentOverview = ({ onShowCalendar }: { onShowCalendar: () => void }) => {
  const { filteredPosts, getCategoryColor } = useContent();
  const today = new Date();
  
  const todayPosts = filteredPosts.filter(p => isSameDay(parseISO(p.date), today));
  const upcomingPosts = filteredPosts
    .filter(p => {
      const date = parseISO(p.date);
      return isBefore(today, date) && isBefore(date, addDays(today, 7)) && !isSameDay(date, today);
    })
    .sort((a, b) => a.date.localeCompare(b.date));
    
  const overduePosts = filteredPosts.filter(p => 
    p.status === "A fazer" && isBefore(parseISO(p.date), startOfDay(today))
  );

  const monthTotal = filteredPosts.length;
  const monthPublished = filteredPosts.filter(p => p.status === "Publicado").length;
  const monthPct = monthTotal > 0 ? Math.round((monthPublished / monthTotal) * 100) : 0;

  return (
    <div className="px-4 sm:px-6 pb-12 max-w-5xl mx-auto w-full animate-fade-in">
      <header className="mb-8">
        <h2 className="font-display text-3xl sm:text-4xl font-light text-foreground tracking-tight">
          Olá! <span className="text-display-italic">Hoje é</span> {format(today, "eeee, d 'de' MMMM", { locale: ptBR })}
        </h2>
        <p className="text-muted-foreground mt-2 font-medium">Aqui está um resumo do seu planejamento de conteúdo.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="md:col-span-2 space-y-8">
          {/* Today section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-display text-xl font-medium">Para hoje</h3>
            </div>
            {todayPosts.length > 0 ? (
              <div className="grid gap-3">
                {todayPosts.map(post => (
                  <PostSummaryCard key={post.id} post={post} color={getCategoryColor(post.category)} />
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 rounded-2xl p-6 border border-dashed border-border flex flex-col items-center text-center">
                <p className="text-sm text-muted-foreground italic">Nenhum post agendado para hoje.</p>
              </div>
            )}
          </section>

          {/* Upcoming section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cat-educativo/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-cat-educativo" />
              </div>
              <h3 className="font-display text-xl font-medium">Próximos 7 dias</h3>
            </div>
            {upcomingPosts.length > 0 ? (
              <div className="grid gap-3">
                {upcomingPosts.map(post => (
                  <PostSummaryCard key={post.id} post={post} color={getCategoryColor(post.category)} showDate />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic px-2">Sem posts agendados para os próximos dias.</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {/* Stats card */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
            <h3 className="font-display text-lg font-medium mb-4 flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-primary" />
              Desempenho do Mês
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground font-medium">Progresso</span>
                  <span className="font-display font-semibold text-primary">{monthPct}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${monthPct}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-xl bg-muted/50 text-center">
                  <div className="text-2xl font-display font-semibold text-foreground">{monthPublished}</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Postados</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 text-center">
                  <div className="text-2xl font-display font-semibold text-foreground">{monthTotal}</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue alert */}
          {overduePosts.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-destructive mb-3">
                <AlertCircle className="h-5 w-5" />
                <h4 className="font-semibold text-sm">Posts Pendentes</h4>
              </div>
              <p className="text-xs text-destructive/80 mb-4 font-medium">Você tem {overduePosts.length} post{overduePosts.length > 1 ? "s" : ""} que já deveria{overduePosts.length > 1 ? "m" : ""} ter sido publicado{overduePosts.length > 1 ? "s" : ""}.</p>
              <button 
                onClick={onShowCalendar}
                className="w-full py-2 bg-destructive text-destructive-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Resolver Agora
              </button>
            </div>
          )}

          {/* Quick link */}
          <button 
            onClick={onShowCalendar}
            className="w-full group bg-primary text-primary-foreground rounded-2xl p-6 shadow-soft-md hover:shadow-soft-lg transition-all flex items-center justify-between overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
            <div className="relative text-left">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Acesso completo</p>
              <h3 className="font-display text-xl font-medium">Ver Calendário</h3>
            </div>
            <ChevronRight className="h-6 w-6 relative group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PostSummaryCard = ({ post, color, showDate }: { post: ContentPost; color: string; showDate?: boolean }) => {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-4 hover:shadow-soft transition-all flex items-center gap-4 group">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: color + "15" }}>
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{post.format}</span>
          {showDate && (
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
              · {format(parseISO(post.date), "dd/MM")}
            </span>
          )}
        </div>
        <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{post.title}</h4>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {post.status === "Publicado" ? (
          <CheckCircle2 className="h-5 w-5 text-status-published" />
        ) : (
          <div className="w-8 h-8 rounded-full border-2 border-muted flex items-center justify-center group-hover:border-primary/30 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-muted group-hover:bg-primary/50 transition-colors" />
          </div>
        )}
      </div>
    </div>
  );
};