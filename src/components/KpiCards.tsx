import { useContent } from "@/context/ContentContext";
import { categoryConfig } from "@/data/content";
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

  // Format counts
  const formatCounts: Record<string, number> = {};
  monthPosts.forEach(p => { formatCounts[p.format] = (formatCounts[p.format] || 0) + 1; });

  // Network counts
  const igCount = monthPosts.filter(p => p.network.includes("Instagram")).length;
  const tkCount = monthPosts.filter(p => p.network.includes("TikTok")).length;

  const pct = total > 0 ? Math.round((published / total) * 100) : 0;

  return (
    <div className="grid grid-cols-4 gap-4 px-6 py-4">
      {/* Total */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground font-medium">Total do Mês</span>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-3xl font-bold text-foreground">{total}</p>
        <p className="text-xs text-muted-foreground mt-1">posts planejados</p>
      </div>

      {/* By format */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground font-medium">Por Formato</span>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-1.5 mt-1">
          {Object.entries(formatCounts).slice(0, 4).map(([fmt, count]) => (
            <div key={fmt} className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{fmt}</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground w-4 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By network */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground font-medium">Por Rede Social</span>
          <Share2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-end gap-4 mt-2">
          <div className="flex-1 text-center">
            <div className="h-16 flex items-end justify-center">
              <div className="w-8 bg-cat-destrave/80 rounded-t-md" style={{ height: `${total > 0 ? (igCount / total) * 64 : 0}px` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">IG</p>
            <p className="text-sm font-bold text-foreground">{igCount}</p>
          </div>
          <div className="flex-1 text-center">
            <div className="h-16 flex items-end justify-center">
              <div className="w-8 bg-cat-educativo/80 rounded-t-md" style={{ height: `${total > 0 ? (tkCount / total) * 64 : 0}px` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">TK</p>
            <p className="text-sm font-bold text-foreground">{tkCount}</p>
          </div>
        </div>
      </div>

      {/* Published vs Pending */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground font-medium">Progresso</span>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Publicados ({published})</span>
            <span>Pendentes ({pending})</span>
          </div>
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-cat-autoridade rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-center text-lg font-bold text-foreground mt-2">{pct}%</p>
        </div>
      </div>
    </div>
  );
};
