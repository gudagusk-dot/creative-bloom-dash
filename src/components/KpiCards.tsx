import { useContent } from "@/context/ContentContext";
import { FileText, Share2, CheckCircle2 } from "lucide-react";

export const KpiCards = () => {
  const { posts, currentMonth } = useContent();

  const monthPosts = posts.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });

  const total = monthPosts.length;
  const published = monthPosts.filter(p => p.status === "Publicado").length;
  const pending = total - published;

  const igCount = monthPosts.filter(p => p.network.includes("Instagram")).length;
  const tkCount = monthPosts.filter(p => p.network.includes("TikTok")).length;

  const pct = total > 0 ? Math.round((published / total) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5">
      {/* Total */}
      <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-5 shadow-soft hover:shadow-soft-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total</span>
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/70" />
        </div>
        <p className="font-display text-3xl sm:text-4xl font-light text-foreground tracking-tight leading-none">{total}</p>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5">posts planejados</p>
      </div>

      {/* By network */}
      <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-5 shadow-soft hover:shadow-soft-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Redes</span>
          <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/70" />
        </div>
        <div className="flex items-end gap-3 mt-1">
          <div className="text-center flex-1">
            <p className="font-display text-2xl sm:text-3xl font-light text-foreground tracking-tight leading-none">{igCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">IG</p>
          </div>
          <div className="w-px h-6 bg-border self-center" />
          <div className="text-center flex-1">
            <p className="font-display text-2xl sm:text-3xl font-light text-foreground tracking-tight leading-none">{tkCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">TK</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-card rounded-2xl border border-border/60 p-4 sm:p-5 shadow-soft hover:shadow-soft-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Progresso</span>
          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/70" />
        </div>
        <div className="mt-1">
          <p className="font-display text-2xl sm:text-3xl font-light text-foreground tracking-tight leading-none">{pct}<span className="text-base text-muted-foreground">%</span></p>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2 mb-1">
            <span>{published} pub.</span>
            <span>{pending} pend.</span>
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
