import { useState } from "react";
import { startOfWeek, addDays, format, isSameDay, isToday, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { ContentPost } from "@/data/content";
import { PostDrawer } from "@/components/PostDrawer";
import { NewPostDialog } from "@/components/NewPostDialog";

export const WeekView = () => {
  const { currentMonth, setCurrentMonth, filteredPosts, viewMode, getCategoryColor } = useContent();
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [newPostDate, setNewPostDate] = useState<string | null>(null);
  const isAdmin = viewMode === "admin";

  const weekStart = startOfWeek(currentMonth, { locale: ptBR });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="px-4 sm:px-6 pb-6 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base text-foreground">
          Semana de {format(weekStart, "d 'de' MMM", { locale: ptBR })}
        </h2>
        <div className="flex gap-1">
          <button onClick={() => setCurrentMonth(subWeeks(currentMonth, 1))} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setCurrentMonth(addWeeks(currentMonth, 1))} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map(day => {
          const dayPosts = filteredPosts.filter(p => isSameDay(new Date(p.date + "T12:00:00"), day));
          const dateStr = format(day, "yyyy-MM-dd");
          const today = isToday(day);
          return (
            <div key={dateStr} className={`rounded-2xl border p-3 flex flex-col gap-2 min-h-[200px] ${today ? "bg-card border-primary/40 shadow-soft" : "bg-card border-border/60"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{format(day, "EEE", { locale: ptBR })}</div>
                  <div className={`font-display text-xl ${today ? "text-primary" : "text-foreground"}`}>{format(day, "d")}</div>
                </div>
                {isAdmin && (
                  <button onClick={() => setNewPostDate(dateStr)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {dayPosts.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/60 italic">Sem conteúdo</p>
                )}
                {dayPosts.map(post => {
                  const color = getCategoryColor(post.category);
                  return (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="text-left rounded-xl border p-2.5 hover:shadow-soft transition-all"
                      style={{ backgroundColor: color + "12", borderColor: color + "40" }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-white" style={{ backgroundColor: color }}>{post.format}</span>
                        <span className="text-[10px] text-muted-foreground">{post.network}</span>
                      </div>
                      <p className="text-xs font-medium text-foreground line-clamp-2">{post.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{post.status}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <PostDrawer post={selectedPost} onClose={() => setSelectedPost(null)} />
      {isAdmin && (
        <NewPostDialog open={!!newPostDate} onClose={() => setNewPostDate(null)} initialDate={newPostDate || undefined} />
      )}
    </div>
  );
};
