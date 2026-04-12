import { useContent } from "@/context/ContentContext";
import { FileText, BarChart3, Share2, CheckCircle2 } from "lucide-react";

export const KpiCards = () => {
  const { posts, currentMonth } = useContent();

  const monthPosts = posts.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });

  const total = monthPosts.length;
  const published = monthPosts.filter(p => p.status === "Publicado").length;
  const pending = total - published;

  const formatCounts: Record<string, number> = {};
  monthPosts.forEach(p => { formatCounts[p.format] = (formatCounts[p.format] || 0) + 1; });

  const igCount = monthPosts.filter(p => p.network.includes("Instagram")).length;
  const tkCount = monthPosts.filter(p => p.network.includes("TikTok")).length;

  const pct = total > 0 ? Math.round((published / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-6 py-3 sm:py-4">
      {/* Total */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">Total</span>
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-foreground">{total}</p>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">posts planejados</p>
      </div>

      {/* By format */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">Formato</span>
          <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        </div>
        <div className="space-y-1 mt-1">
          {Object.entries(formatCounts).slice(0, 3).map(([fmt, count]) => (
            <div key={fmt} className="flex justify-between items-center">
              <span className="text-[10px] sm:text-xs text-muted-foreground truncate mr-1">{fmt}</span>
              <span className="text-[10px] sm:text-xs font-semibold text-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By network */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">Redes</span>
          <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        </div>
        <div className="flex items-end gap-3 mt-1">
          <div className="text-center flex-1">
            <p className="text-lg sm:text-xl font-bold text-foreground">{igCount}</p>
            <p className="text-[10px] text-muted-foreground">IG</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-lg sm:text-xl font-bold text-foreground">{tkCount}</p>
            <p className="text-[10px] text-muted-foreground">TK</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">Progresso</span>
          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        </div>
        <div className="mt-1">
          <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground mb-1">
            <span>{published} pub.</span>
            <span>{pending} pend.</span>
          </div>
          <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-cat-autoridade rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-center text-base sm:text-lg font-bold text-foreground mt-1">{pct}%</p>
        </div>
      </div>
    </div>
  );
};
