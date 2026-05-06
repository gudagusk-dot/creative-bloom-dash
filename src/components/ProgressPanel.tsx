import { useEffect, useMemo, useState } from "react";
import { X, Activity, Image as ImageIcon, Video as VideoIcon, AlertCircle, Clock, ExternalLink, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useContent } from "@/context/ContentContext";
import { ActivityRow } from "@/lib/activity";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContentPost, categoryConfig } from "@/data/content";
import { PostDrawer } from "./PostDrawer";

interface Props {
  open: boolean;
  onClose: () => void;
  studentId: string;
}

type Tab = "pendentes" | "producao" | "publicados" | "midias" | "atividade";

const isVideo = (u: string) => /\.(mp4|mov|webm)(\?|$)/i.test(u);

export const ProgressPanel = ({ open, onClose, studentId }: Props) => {
  const { posts } = useContent();
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [openPost, setOpenPost] = useState<ContentPost | null>(null);
  const [tab, setTab] = useState<Tab>("pendentes");

  useEffect(() => {
    if (!open || !studentId) return;
    supabase
      .from("post_activity")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setActivity((data || []) as ActivityRow[]));

    const channel = supabase
      .channel(`activity:${studentId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post_activity", filter: `student_id=eq.${studentId}` },
        (payload) => setActivity((prev) => [payload.new as ActivityRow, ...prev])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, studentId]);

  const postById = useMemo(() => {
    const m = new Map<string, ContentPost>();
    posts.forEach((p) => m.set(p.id, p));
    return m;
  }, [posts]);

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((p) => p.status === "Publicado").length;
    const inProd = posts.filter((p) => p.status === "Em produção").length;
    const todo = posts.filter((p) => p.status === "A fazer").length;
    const overdue = posts.filter((p) => p.status !== "Publicado" && p.date < today).length;
    const mediaCount = posts.reduce((acc, p) => acc + (p.media_urls?.length || 0), 0);
    const linksCount = posts.filter((p) => (p.published_url || "").trim().length > 0).length;
    return { total, published, inProd, todo, overdue, mediaCount, linksCount };
  }, [posts, today]);

  const pendentes = useMemo(
    () => posts.filter((p) => p.status === "A fazer").sort((a, b) => a.date.localeCompare(b.date)),
    [posts]
  );
  const producao = useMemo(
    () => posts.filter((p) => p.status === "Em produção").sort((a, b) => a.date.localeCompare(b.date)),
    [posts]
  );
  const publicados = useMemo(
    () => posts.filter((p) => p.status === "Publicado").sort((a, b) => b.date.localeCompare(a.date)),
    [posts]
  );

  const allMedia = useMemo(() => {
    const out: { url: string; postId: string; title: string }[] = [];
    posts.forEach((p) => (p.media_urls || []).forEach((url) => out.push({ url, postId: p.id, title: p.title })));
    return out;
  }, [posts]);

  const renderActivity = (a: ActivityRow) => {
    const post = postById.get(a.post_id);
    const title = post?.title || "Post removido";
    if (a.action === "status_changed") return <>Marcou <strong>{title}</strong> como <em>{a.details.to}</em></>;
    if (a.action === "media_uploaded") return <>Enviou {a.details.count || 1} mídia(s) para <strong>{title}</strong></>;
    if (a.action === "media_removed") return <>Removeu mídia de <strong>{title}</strong></>;
    if (a.action === "link_added") return <>Adicionou link do post em <strong>{title}</strong></>;
    if (a.action === "note_added") return <>Comentou em <strong>{title}</strong></>;
    return null;
  };

  const PostListCard = ({ p }: { p: ContentPost }) => {
    const color = categoryConfig[p.category]?.color || "#999";
    const overdue = p.status !== "Publicado" && p.date < today;
    return (
      <button
        onClick={() => setOpenPost(p)}
        className="w-full text-left rounded-xl border border-border bg-background hover:bg-secondary/40 p-3 transition-colors flex items-start gap-3"
      >
        <span className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: color }}>{p.format}</span>
            <span className="text-[11px] text-muted-foreground">{p.network}</span>
            {overdue && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-destructive/15 text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />atrasado</span>}
          </div>
          <p className="text-sm font-medium text-foreground line-clamp-2">{p.title}</p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span>{p.date}</span>
            {(p.media_urls?.length || 0) > 0 && <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" />{p.media_urls!.length}</span>}
            {p.published_url && <span className="flex items-center gap-1 text-primary"><ExternalLink className="h-3 w-3" />link</span>}
            {p.student_notes && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />nota</span>}
          </div>
        </div>
      </button>
    );
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[620px] bg-card border-l border-border/60 shadow-soft-xl z-50 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Progresso do aluno</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 border-b border-border">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <Stat label="Total" value={stats.total} />
            <Stat label="A fazer" value={stats.todo} />
            <Stat label="Produção" value={stats.inProd} accent="text-cat-situacoes" />
            <Stat label="Publicados" value={stats.published} accent="text-cat-autoridade" />
            <Stat label="Mídias" value={stats.mediaCount} accent="text-primary" />
            <Stat label="Links" value={stats.linksCount} accent="text-primary" />
          </div>
          {stats.overdue > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg p-2">
              <AlertCircle className="h-3.5 w-3.5" /> {stats.overdue} conteúdo(s) atrasado(s)
            </div>
          )}
        </div>

        <div className="flex border-b border-border overflow-x-auto">
          {([
            ["pendentes", `Pendentes (${pendentes.length})`],
            ["producao", `Produção (${producao.length})`],
            ["publicados", `Publicados (${publicados.length})`],
            ["midias", `Mídias (${allMedia.length})`],
            ["atividade", "Atividade"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k as Tab)}
              className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                tab === k ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >{label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {tab === "pendentes" && (
            pendentes.length === 0
              ? <p className="text-xs text-muted-foreground italic">Nenhum conteúdo pendente.</p>
              : <div className="space-y-2">{pendentes.map(p => <PostListCard key={p.id} p={p} />)}</div>
          )}
          {tab === "producao" && (
            producao.length === 0
              ? <p className="text-xs text-muted-foreground italic">Nada em produção.</p>
              : <div className="space-y-2">{producao.map(p => <PostListCard key={p.id} p={p} />)}</div>
          )}
          {tab === "publicados" && (
            publicados.length === 0
              ? <p className="text-xs text-muted-foreground italic">Ainda não há conteúdos publicados.</p>
              : <div className="space-y-2">
                  {publicados.map(p => (
                    <div key={p.id}>
                      <PostListCard p={p} />
                      {p.published_url && (
                        <a href={p.published_url} target="_blank" rel="noopener noreferrer" className="block ml-4 mt-1 text-[11px] text-primary truncate hover:underline">
                          ↗ {p.published_url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
          )}
          {tab === "midias" && (
            allMedia.length === 0
              ? <p className="text-xs text-muted-foreground italic">Nenhuma mídia enviada ainda.</p>
              : <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {allMedia.map(({ url, title }, idx) => (
                    <button key={idx} onClick={() => setPreview(url)} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted group" title={title}>
                      {isVideo(url) ? (
                        <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                          <VideoIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      ) : (
                        <img src={url} alt={title} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-1 bg-foreground/60 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">{title}</div>
                    </button>
                  ))}
                </div>
          )}
          {tab === "atividade" && (
            activity.length === 0
              ? <p className="text-xs text-muted-foreground italic">Nenhuma atividade ainda.</p>
              : <ul className="space-y-2">
                  {activity.map((a) => (
                    <li key={a.id} className="text-xs flex items-start gap-2 p-2 rounded-lg bg-secondary/50">
                      <Clock className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-foreground flex-1">{renderActivity(a)}</span>
                      <span className="text-muted-foreground shrink-0 whitespace-nowrap">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </li>
                  ))}
                </ul>
          )}
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
      <PostDrawer post={openPost} onClose={() => setOpenPost(null)} />
    </>
  );
};

const Stat = ({ label, value, accent }: { label: string; value: number; accent?: string }) => (
  <div className="rounded-xl border border-border/60 bg-background p-2.5">
    <div className={`font-display text-xl font-light ${accent || "text-foreground"}`}>{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
  </div>
);
