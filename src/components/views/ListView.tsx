import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useContent } from "@/context/ContentContext";
import { ContentPost } from "@/data/content";
import { PostDrawer } from "@/components/PostDrawer";

export const ListView = () => {
  const { currentMonth, filteredPosts } = useContent();
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);

  const monthPosts = useMemo(() => {
    return filteredPosts
      .filter(p => {
        const d = new Date(p.date + "T12:00:00");
        return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredPosts, currentMonth]);

  return (
    <div className="px-4 sm:px-6 pb-6 flex-1">
      {monthPosts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">Nenhum conteúdo neste mês.</p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card overflow-hidden">
          {monthPosts.map(post => {
            const color = categoryConfig[post.category]?.color || "#999";
            const d = new Date(post.date + "T12:00:00");
            return (
              <li key={post.id}>
                <button onClick={() => setSelectedPost(post)} className="w-full text-left p-3 sm:p-4 hover:bg-secondary/40 transition-colors flex items-start gap-3">
                  <div className="shrink-0 text-center w-12">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{format(d, "EEE", { locale: ptBR })}</div>
                    <div className="font-display text-xl text-foreground">{format(d, "d")}</div>
                  </div>
                  <span className="w-1 self-stretch rounded-full" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white" style={{ backgroundColor: color }}>{post.format}</span>
                      <span className="text-[10px] text-muted-foreground">{post.network}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{post.category}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{post.title}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 self-center">{post.status}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <PostDrawer post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
};
