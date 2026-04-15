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
  return <Instagram className="h-3 w-3 text-muted-foreground" />;
};

const statusLabel: Record<string, string> = {
  "A fazer": "A fazer",
  "Em produção": "Produzindo",
  "Publicado": "✓",
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

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 auto-rows-fr" style={{ minHeight: "calc(100vh - 340px)" }}>
          {days.map(day => {
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const dayPosts = getPostsForDay(day);
            const dateStr = format(day, "yyyy-MM-dd");

            // If there are posts, each post IS the card for that day
            if (dayPosts.length > 0 && inMonth) {
              return (
                <div key={day.toISOString()} className="flex flex-col gap-1 min-h-[70px] sm:min-h-0">
                  {dayPosts.map((post, idx) => {
                    const catColor = categoryConfig[post.category]?.color || "#999";
                    return (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className="w-full rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer border border-transparent hover:border-white/30 relative group"
                        style={{ backgroundColor: catColor + "20", borderColor: catColor + "40" }}
                      >
                        {/* Day number */}
                        <span className={`absolute top-1 left-1.5 text-[9px] sm:text-[10px] font-bold ${today ? "text-primary" : "text-muted-foreground"}`}>
                          {idx === 0 ? format(day, "d") : ""}
                        </span>

                        {/* Format + Network badges */}
                        <div className="flex items-center gap-1 mb-0.5 mt-2 sm:mt-3">
                          <span
                            className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-semibold text-white leading-none"
                            style={{ backgroundColor: catColor }}
                          >
                            {post.format}
                          </span>
                          <NetworkIcon network={post.network} />
                        </div>

                        {/* Full title - no truncation */}
                        <p className="text-[9px] sm:text-[11px] text-foreground leading-tight font-medium px-0.5">
                          {post.title}
                        </p>

                        {/* Status indicator */}
                        <span className="text-[7px] sm:text-[8px] text-muted-foreground mt-0.5">
                          {statusLabel[post.status] || post.status}
                        </span>
                      </button>
                    );
                  })}
                  {/* Add more button */}
                  <button
                    onClick={() => setNewPostDate(dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-primary transition-all flex items-center justify-center"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              );
            }

            // Empty day cell
            return (
              <div
                key={day.toISOString()}
                className={`rounded-lg border p-1 sm:p-2 flex flex-col min-h-[70px] sm:min-h-0 group transition-colors ${
                  !inMonth
                    ? "bg-muted/20 border-transparent"
                    : today
                    ? "bg-card border-primary/50 shadow-sm"
                    : "bg-muted/10 border-border/30"
                }`}
              >
                <span className={`text-[10px] sm:text-xs font-medium ${
                  !inMonth ? "text-muted-foreground/30" : today ? "text-primary font-bold" : "text-muted-foreground"
                }`}>
                  {format(day, "d")}
                </span>
                {inMonth && (
                  <button
                    onClick={() => setNewPostDate(dateStr)}
                    className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="h-4 w-4 text-muted-foreground/40 hover:text-primary transition-colors" />
                  </button>
                )}
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
