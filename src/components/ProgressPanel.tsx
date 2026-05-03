import { useEffect, useMemo, useState } from "react";
import { X, Activity, Image as ImageIcon, Video as VideoIcon, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useContent } from "@/context/ContentContext";
import { ActivityRow } from "@/lib/activity";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  open: boolean;
  onClose: () => void;
  ownerId: string;
}

const isVideo = (u: string) => /\.(mp4|mov|webm)(\?|$)/i.test(u);

export const ProgressPanel = ({ open, onClose, ownerId }: Props) => {
  const { posts } = useContent();
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !ownerId) return;
    supabase
      .from("post_activity")
      .select("*")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setActivity((data || []) as ActivityRow[]));

    const channel = supabase
      .channel(`activity:${ownerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post_activity", filter: `user_id=eq.${ownerId}` },
        (payload) => setActivity((prev) => [payload.new as ActivityRow, ...prev])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, ownerId]);

  const postById = useMemo(() => {
    const m = new Map<string, typeof posts[number]>();
    posts.forEach((p) => m.set(p.id, p));
    return m;
  }, [posts]);

  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((p) => p.status === "Publicado").length;
    const inProd = posts.filter((p) => p.status === "Em produção").length;
    const todo = posts.filter((p) => p.status === "A fazer").length;
    const mediaCount = posts.reduce((acc, p) => acc + (p.media_urls?.length || 0), 0);
    return { total, published, inProd, todo, mediaCount };
  }, [posts]);

  const allMedia = useMemo(() => {
    const out: { url: string; postId: string; title: string }[] = [];
    posts.forEach((p) => (p.media_urls || []).forEach((url) => out.push({ url, postId: p.id, title: p.title })));
    return out;
  }, [posts]);

  const today = new Date().toISOString().slice(0, 10);
  const overdue = posts.filter((p) => p.status !== "Publicado" && p.date < today);
  const upcoming = posts.filter((p) => p.status === "A fazer" && p.date >= today).slice(0, 5);

  const renderActivity = (a: ActivityRow) => {
    const post = postById.get(a.post_id);
    const title = post?.title || "Post removido";
    if (a.action === "status_changed") {
      return <>Marcou <strong>{title}</strong> como <em>{a.details.to}</em></>;
    }
    if (a.action === "media_uploaded") {
      return <>Enviou {a.details.count || 1} mídia(s) para <strong>{title}</strong></>;
    }
    if (a.action === "media_removed") {
      return <>Removeu mídia de <strong>{title}</strong></>;
    }
    return null;
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[560px] bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Progresso do aluno</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="Total" value={stats.total} />
            <Stat label="Publicados" value={stats.published} accent="text-cat-autoridade" />
            <Stat label="Em produção" value={stats.inProd} accent="text-cat-situacoes" />
            <Stat label="Mídias" value={stats.mediaCount} accent="text-primary" />
          </div>

          {/* Pendências */}
          {(overdue.length > 0 || upcoming.length > 0) && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pendências</h3>
              <div className="space-y-1.5">
                {overdue.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate flex-1">{p.title}</span>
                    <span className="shrink-0 opacity-70">{p.date}</span>
                  </div>
                ))}
                {upcoming.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-cat-situacoes/10 text-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-cat-situacoes" />
                    <span className="truncate flex-1">{p.title}</span>
                    <span className="shrink-0 text-muted-foreground">{p.date}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Activity timeline */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Atividade recente</h3>
            {activity.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhuma atividade ainda. Quando o aluno mexer no calendário, aparece aqui.</p>
            ) : (
              <ul className="space-y-2">
                {activity.map((a) => (
                  <li key={a.id} className="text-xs flex items-start gap-2 p-2 rounded-lg bg-secondary/50">
                    <span className="text-foreground flex-1">{renderActivity(a)}</span>
                    <span className="text-muted-foreground shrink-0 whitespace-nowrap">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Media gallery */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Mídias enviadas ({allMedia.length})
            </h3>
            {allMedia.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhuma mídia enviada ainda.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {allMedia.map(({ url, title }, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPreview(url)}
                    className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted group"
                    title={title}
                  >
                    {isVideo(url) ? (
                      <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                        <VideoIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ) : (
                      <img src={url} alt={title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-1 bg-foreground/60 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {title}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {preview && (
          <div className="fixed inset-0 z-[60] bg-foreground/80 flex items-center justify-center p-6" onClick={() => setPreview(null)}>
            {isVideo(preview) ? (
              <video src={preview} controls className="max-w-full max-h-full rounded-lg" />
            ) : (
              <img src={preview} alt="preview" className="max-w-full max-h-full rounded-lg" />
            )}
          </div>
        )}
      </div>
    </>
  );
};

const Stat = ({ label, value, accent }: { label: string; value: number; accent?: string }) => (
  <div className="rounded-lg border border-border bg-background p-2.5">
    <div className={`text-xl font-semibold ${accent || "text-foreground"}`}>{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);
