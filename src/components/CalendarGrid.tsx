import { useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday, isSameDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useContent } from "@/context/ContentContext";
import { categoryConfig, ContentPost } from "@/data/content";
import { Instagram } from "lucide-react";
import { PostDrawer } from "./PostDrawer";

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getPostsForDay = (day: Date) =>
    filteredPosts.filter(p => isSameDay(new Date(p.date + "T12:00:00"), day));

  return (
    <>
      <div className="px-6 pb-6 flex-1">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {dayNames.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1 auto-rows-fr" style={{ minHeight: "calc(100vh - 340px)" }}>
          {days.map(day => {
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const dayPosts = getPostsForDay(day);

            return (
              <div
                key={day.toISOString()}
                className={`rounded-lg border p-2 flex flex-col transition-colors ${
                  !inMonth
                    ? "bg-muted/30 border-transparent"
                    : today
                    ? "bg-card border-primary/50 shadow-sm"
                    : dayPosts.length > 0
                    ? "bg-card border-border"
                    : "bg-muted/20 border-border/50"
                }`}
              >
                <span className={`text-xs font-medium mb-1 ${
                  !inMonth ? "text-muted-foreground/40" : today ? "text-primary font-bold" : "text-muted-foreground"
                }`}>
                  {format(day, "d")}
                </span>
                <div className="space-y-1 flex-1 overflow-hidden">
                  {dayPosts.slice(0, 2).map(post => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="w-full text-left rounded-md p-1.5 hover:ring-1 hover:ring-primary/30 transition-all group cursor-pointer"
                      style={{ backgroundColor: `${categoryConfig[post.category].color}15` }}
                    >
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
                      <p className="text-[10px] text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </p>
                    </button>
                  ))}
                  {dayPosts.length > 2 && (
                    <span className="text-[9px] text-muted-foreground">+{dayPosts.length - 2} mais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PostDrawer post={selectedPost} onClose={() => setSelectedPost(null)} />
    </>
  );
};
