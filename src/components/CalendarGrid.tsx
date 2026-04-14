import { useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday, isSameDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useContent } from "@/context/ContentContext";
import { categoryConfig, ContentPost } from "@/data/content";
import { Instagram, Plus } from "lucide-react";
import { PostDrawer } from "./PostDrawer";
import { NewPostDialog } from "./NewPostDialog";

const dayNamesFull = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const dayNamesShort = ["D", "S", "T", "Q", "Q", "S", "S"];

const NetworkIcon = ({ network }: { network: string }) => {
  if (network.includes("TikTok")) {
    return <span className="text-[10px]">🎵</span>;
  }
  return <Instagram className="h-3 w-3 text-cat-bastidores" />;
};

const statusDot: Record<string, string> = {
  "A fazer": "bg-muted-foreground/40",
  "Em produção": "bg-cat-situacoes",
  "Publicado": "bg-cat-autoridade",
};

export const CalendarGrid = () => {
  const { currentMonth, filteredPosts } = useContent();
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [newPostDate, setNewPostDate] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getPostsForDay = (day: Date) =>
    filteredPosts.filter(p => isSameDay(new Date(p.date + "T12:00:00"), day));

  return (
    <>
      <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex-1">
        <div className="grid grid-cols-7 mb-1">
          {dayNamesFull.map((d, i) => (
            <div key={d + i} className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground py-1.5 sm:py-2 uppercase tracking-wider">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{dayNamesShort[i]}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 auto-rows-fr" style={{ minHeight: "calc(100vh - 340px)" }}>
          {days.map(day => {
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const dayPosts = getPostsForDay(day);
            const dateStr = format(day, "yyyy-MM-dd");

            return (
              <div
                key={day.toISOString()}
                className={`rounded-md sm:rounded-lg border p-1 sm:p-2 flex flex-col transition-colors min-h-[60px] sm:min-h-0 group ${
                  !inMonth
                    ? "bg-muted/30 border-transparent"
                    : today
                    ? "bg-card border-primary/50 shadow-sm"
                    : dayPosts.length > 0
                    ? "bg-card border-border"
                    : "bg-muted/20 border-border/50"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                  <span className={`text-[10px] sm:text-xs font-medium ${
                    !inMonth ? "text-muted-foreground/40" : today ? "text-primary font-bold" : "text-muted-foreground"
                  }`}>
                    {format(day, "d")}
                  </span>
                  {inMonth && (
                    <button
                      onClick={() => setNewPostDate(dateStr)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-primary/10 transition-all text-muted-foreground hover:text-primary"
                      title="Adicionar conteúdo"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="space-y-0.5 sm:space-y-1 flex-1 overflow-hidden">
                  {dayPosts.slice(0, 2).map(post => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="w-full text-left rounded-md p-1 sm:p-1.5 hover:ring-1 hover:ring-primary/30 transition-all group/card cursor-pointer"
                      style={{ backgroundColor: `${categoryConfig[post.category].color}15` }}
                    >
                      <div className="sm:hidden flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryConfig[post.category].color }} />
                        <p className="text-[8px] text-foreground leading-tight line-clamp-1">{post.format}</p>
                        <span className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[post.status]}`} />
                      </div>
                      <div className="hidden sm:block">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold text-white leading-none"
                            style={{ backgroundColor: categoryConfig[post.category].color }}
                          >
                            {post.format}
                          </span>
                          <NetworkIcon network={post.network} />
                          <span className={`ml-auto w-1.5 h-1.5 rounded-full ${statusDot[post.status]}`} />
                        </div>
                        <p className="text-[10px] text-foreground leading-tight line-clamp-2 group-hover/card:text-primary transition-colors">
                          {post.title}
                        </p>
                      </div>
                    </button>
                  ))}
                  {dayPosts.length > 2 && (
                    <span className="text-[8px] sm:text-[9px] text-muted-foreground">+{dayPosts.length - 2}</span>
                  )}
                  {dayPosts.length === 0 && inMonth && (
                    <button
                      onClick={() => setNewPostDate(dateStr)}
                      className="w-full h-full min-h-[20px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="h-4 w-4 text-muted-foreground/50" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PostDrawer post={selectedPost} onClose={() => setSelectedPost(null)} />
      <NewPostDialog
        open={!!newPostDate}
        onClose={() => setNewPostDate(null)}
        initialDate={newPostDate || undefined}
      />
    </>
  );
};
