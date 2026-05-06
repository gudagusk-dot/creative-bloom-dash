import { useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday, isSameDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useContent } from "@/context/ContentContext";
import { categoryConfig, ContentPost } from "@/data/content";
import { Instagram, Plus, CalendarX } from "lucide-react";
import { TikTokIcon } from "./TikTokIcon";
import { PostDrawer } from "./PostDrawer";
import { NewPostDialog } from "./NewPostDialog";

const dayNamesFull = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const dayNamesShort = ["D", "S", "T", "Q", "Q", "S", "S"];

const NetworkIcon = ({ network }: { network: string }) => {
  const isTikTok = network.includes("TikTok");
  const isInsta = network.includes("Instagram");
  return (
    <span className="inline-flex items-center gap-0.5">
      {isInsta && <Instagram className="h-3 w-3 text-cat-destrave" />}
      {isTikTok && <TikTokIcon className="h-3 w-3 text-foreground" />}
    </span>
  );
};

const statusLabel: Record<string, string> = {
  "A fazer": "A fazer",
  "Em produção": "Produzindo",
  "Publicado": "Publicado ✓",
};

export const CalendarGrid = () => {
  const { currentMonth, filteredPosts, viewMode } = useContent();
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [newPostDate, setNewPostDate] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const isAdmin = viewMode === "admin";

  const getPostsForDay = (day: Date) =>
    filteredPosts.filter(p => isSameDay(new Date(p.date + "T12:00:00"), day));

  const monthHasPosts = filteredPosts.some(p => {
    const d = new Date(p.date + "T12:00:00");
    return isSameMonth(d, currentMonth);
  });

  return (
    <>
      <div className="px-2 sm:px-6 pb-4 sm:pb-6 flex-1">
        <div className="grid grid-cols-7 mb-2">
          {dayNamesFull.map((d, i) => (
            <div key={d + i} className="text-center text-[10px] sm:text-[11px] font-semibold text-muted-foreground/80 py-2 uppercase tracking-[0.15em]">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{dayNamesShort[i]}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={format(currentMonth, "yyyy-MM")}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-7 gap-1.5 sm:gap-2 auto-rows-fr"
            style={{ minHeight: "calc(100vh - 280px)" }}
          >
            {days.map(day => {
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const dayPosts = getPostsForDay(day);
              const dateStr = format(day, "yyyy-MM-dd");
              const dayLabel = format(day, "d");

              const wrapperBase = `relative rounded-2xl border flex flex-col min-h-[78px] sm:min-h-[120px] overflow-hidden transition-all duration-200 ease-soft group ${
                !inMonth
                  ? "bg-muted/20 border-transparent"
                  : today
                  ? "bg-card border-primary/40 shadow-soft"
                  : dayPosts.length > 0
                  ? "bg-card border-border/40 hover:border-border/70 hover:shadow-soft"
                  : "bg-muted/10 border-border/30 hover:border-border/50"
              }`;

              return (
                <div key={day.toISOString()} className={wrapperBase}>
                  {/* Day number */}
                  <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5 shrink-0">
                    <span className={`text-[10px] sm:text-[11px] font-bold leading-none ${
                      !inMonth ? "text-muted-foreground/40" : today ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {dayLabel}
                    </span>
                    {inMonth && isAdmin && (
                      <button
                        onClick={() => setNewPostDate(dateStr)}
                        className="p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all"
                        title="Adicionar conteúdo"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Posts */}
                  {dayPosts.length > 0 && inMonth && (
                    <div className="flex-1 flex flex-col gap-0.5 px-1 pb-1 min-h-0">
                      {dayPosts.map((post) => {
                        const catColor = categoryConfig[post.category]?.color || "#999";
                        return (
                          <button
                            key={post.id}
                            onClick={() => setSelectedPost(post)}
                            className="flex-1 w-full rounded-xl p-1 sm:p-1.5 flex flex-col items-center justify-center text-center transition-all duration-200 ease-soft hover:scale-[1.03] cursor-pointer border min-h-0 overflow-hidden"
                            style={{
                              backgroundColor: catColor + "1A",
                              borderColor: catColor + "40",
                              boxShadow: `0 1px 0 ${catColor}10`,
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <span
                                className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-semibold text-white leading-none"
                                style={{ backgroundColor: catColor }}
                              >
                                {post.format}
                              </span>
                              <NetworkIcon network={post.network} />
                            </div>
                            <p className="hidden sm:block text-[11px] text-foreground leading-tight font-medium px-0.5 line-clamp-3 mt-0.5">
                              {post.title}
                            </p>
                            <span className="hidden sm:block text-[9px] text-muted-foreground mt-0.5">
                              {statusLabel[post.status] || post.status}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {dayPosts.length === 0 && inMonth && isAdmin && (
                    <button
                      onClick={() => setNewPostDate(dateStr)}
                      className="hidden sm:flex flex-1 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="h-4 w-4 text-muted-foreground/40 hover:text-primary transition-colors" />
                    </button>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {!monthHasPosts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 text-xs text-muted-foreground">
              <CalendarX className="h-3.5 w-3.5" />
              Nenhum conteúdo neste mês {isAdmin && "— passe o mouse num dia para adicionar"}
            </div>
          </motion.div>
        )}
      </div>

      <PostDrawer post={selectedPost} onClose={() => setSelectedPost(null)} />
      {isAdmin && (
        <NewPostDialog
          open={!!newPostDate}
          onClose={() => setNewPostDate(null)}
          initialDate={newPostDate || undefined}
        />
      )}
    </>
  );
};
