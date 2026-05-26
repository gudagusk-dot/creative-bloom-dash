import { useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday, isSameDay, isBefore, startOfDay, parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors,
} from "@dnd-kit/core";
import { useContent } from "@/context/ContentContext";
import { ContentPost } from "@/data/content";
import { Instagram, Plus, CalendarX, CheckCircle2, Loader2, AlertCircle, EyeOff } from "lucide-react";
import { TikTokIcon } from "@/components/TikTokIcon";
import { PostDrawer } from "@/components/PostDrawer";
import { NewPostDialog } from "@/components/NewPostDialog";

const dayNamesFull = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const dayNamesShort = ["D", "S", "T", "Q", "Q", "S", "S"];

const NetworkIcon = ({ network }: { network: string }) => (
  <span className="inline-flex items-center gap-0.5">
    {network.includes("Instagram") && <Instagram className="h-2.5 w-2.5 opacity-70" />}
    {network.includes("TikTok") && <TikTokIcon className="h-2.5 w-2.5 opacity-70" />}
  </span>
);

const statusIcons: Record<string, React.ReactNode> = {
  "A fazer": <Plus className="h-2 w-2" />,
  "Em produção": <Loader2 className="h-2 w-2 animate-spin" />,
  "Publicado": <CheckCircle2 className="h-2 w-2" />,
};

const PostCard = ({ post, onClick, dragging }: { post: ContentPost; onClick?: () => void; dragging?: boolean }) => {
  const { getCategoryColor, viewMode } = useContent();
  const isAdmin = viewMode === "admin";
  const catColor = getCategoryColor(post.category);
  
  const isOverdue = post.status === "A fazer" && isBefore(parseISO(post.date), startOfDay(new Date()));
  const isHidden = isAdmin && post.published === false;
  
  let statusBg = "bg-status-todo";
  if (post.status === "Publicado") statusBg = "bg-status-published";
  else if (post.status === "Em produção") statusBg = "bg-status-progress";
  else if (isOverdue) statusBg = "bg-status-overdue";

  return (
    <button
      onClick={onClick}
      className={`group relative flex-1 w-full rounded-xl p-2 flex flex-col transition-all duration-300 ease-soft cursor-pointer border min-h-0 overflow-hidden text-left ${
        dragging ? "opacity-50 scale-95" : "hover:scale-[1.02] hover:shadow-soft-md shadow-sm border-border/40"
      } ${post.status === "Publicado" ? "glow-published" : ""} ${isHidden ? "grayscale bg-gray-50 opacity-80" : ""}`}
      style={{
        backgroundColor: isHidden ? "#f9fafb" : "white",
        borderLeftWidth: "4px",
        borderLeftColor: isHidden ? "#9ca3af" : catColor,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold text-white uppercase tracking-tighter" style={{ backgroundColor: isHidden ? "#9ca3af" : catColor }}>
            {post.format}
          </span>
          <NetworkIcon network={post.network} />
          {isHidden && <EyeOff className="h-2.5 w-2.5 text-gray-400" />}
        </div>
        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${isHidden ? "bg-gray-400" : statusBg}`}>
          {isOverdue && post.status === "A fazer" && !isHidden ? <AlertCircle className="h-2.5 w-2.5 animate-pulse" /> : statusIcons[post.status]}
        </div>
      </div>
      <p className={`text-[10px] sm:text-[11px] leading-tight font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors ${isHidden ? "text-gray-400" : "text-foreground"}`}>
        {post.title}
      </p>
      <div className="flex items-center gap-1 mt-auto">
        <span className={`w-1.5 h-1.5 rounded-full ${isHidden ? "bg-gray-400" : statusBg}`} />
        <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
          {isHidden ? "Oculto" : post.status}
        </span>
      </div>
    </button>
  );
};

const DraggablePost = ({ post, onClick, isAdmin }: { post: ContentPost; onClick: () => void; isAdmin: boolean }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: post.id, disabled: !isAdmin });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className="flex-1 min-h-0 touch-none">
      <PostCard post={post} onClick={onClick} dragging={isDragging} />
    </div>
  );
};

const DroppableDay = ({
  day, dateStr, inMonth, today, isAdmin, onAdd, children,
}: { day: Date; dateStr: string; inMonth: boolean; today: boolean; isAdmin: boolean; onAdd: () => void; children: React.ReactNode; }) => {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr, disabled: !isAdmin || !inMonth });
  const wrapperBase = `relative rounded-2xl border flex flex-col min-h-[78px] sm:min-h-[120px] overflow-hidden transition-all duration-200 ease-soft group ${
    !inMonth
      ? "bg-muted/20 border-transparent"
      : isOver
      ? "bg-primary/10 border-primary shadow-soft-md"
      : today
      ? "bg-card border-primary/40 shadow-soft"
      : "bg-card border-border/40 hover:border-border/70 hover:shadow-soft"
  }`;
  return (
    <div ref={setNodeRef} className={wrapperBase}>
      <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5 shrink-0">
        <span className={`text-[10px] sm:text-[11px] font-bold leading-none ${
          !inMonth ? "text-muted-foreground/40" : today ? "text-primary" : "text-muted-foreground"
        }`}>{format(day, "d")}</span>
        {inMonth && isAdmin && (
          <button onClick={onAdd} className="p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all" title="Adicionar conteúdo">
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

export const MonthView = () => {
  const { currentMonth, filteredPosts, viewMode, updatePost } = useContent();
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [newPostDate, setNewPostDate] = useState<string | null>(null);
  const [activePost, setActivePost] = useState<ContentPost | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const isAdmin = viewMode === "admin";

  const getPostsForDay = (day: Date) => filteredPosts.filter(p => isSameDay(new Date(p.date + "T12:00:00"), day));
  const monthHasPosts = filteredPosts.some(p => isSameMonth(new Date(p.date + "T12:00:00"), currentMonth));

  const handleDragStart = (e: DragStartEvent) => {
    const p = filteredPosts.find(p => p.id === e.active.id);
    if (p) setActivePost(p);
  };
  const handleDragEnd = (e: DragEndEvent) => {
    setActivePost(null);
    if (!e.over || e.over.id === undefined) return;
    const newDate = String(e.over.id);
    const post = filteredPosts.find(p => p.id === e.active.id);
    if (!post || post.date === newDate) return;
    updatePost(post.id, { date: newDate });
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
            className="grid grid-cols-7 gap-1 sm:gap-1.5 auto-rows-fr"
            style={{ minHeight: "calc(100vh - 280px)" }}
          >
            {days.map(day => {
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const dayPosts = getPostsForDay(day);
              const dateStr = format(day, "yyyy-MM-dd");
              return (
                <DroppableDay
                  key={day.toISOString()}
                  day={day}
                  dateStr={dateStr}
                  inMonth={inMonth}
                  today={today}
                  isAdmin={isAdmin}
                  onAdd={() => setNewPostDate(dateStr)}
                >
                  {dayPosts.length > 0 && inMonth && (
                    <div className="flex-1 flex flex-col gap-0.5 px-1 pb-1 min-h-0">
                      {dayPosts.map(post => (
                        <DraggablePost key={post.id} post={post} onClick={() => setSelectedPost(post)} isAdmin={isAdmin} />
                      ))}
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
                </DroppableDay>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {!monthHasPosts && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 text-xs text-muted-foreground">
              <CalendarX className="h-3.5 w-3.5" />
              Nenhum conteúdo neste mês {isAdmin && "— passe o mouse num dia para adicionar"}
            </div>
          </motion.div>
        )}
      </div>

      <DragOverlay>
        {activePost ? <div className="w-[120px] h-[80px]"><PostCard post={activePost} /></div> : null}
      </DragOverlay>

      <PostDrawer post={selectedPost} onClose={() => setSelectedPost(null)} />
      {isAdmin && (
        <NewPostDialog open={!!newPostDate} onClose={() => setNewPostDate(null)} initialDate={newPostDate || undefined} />
      )}
    </DndContext>
  );
};
