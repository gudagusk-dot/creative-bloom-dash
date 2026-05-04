import { useState, useEffect } from "react";
import { X, Trash2, Save, Pencil, Eye, ExternalLink } from "lucide-react";
import { ContentPost, categoryConfig, PostStatus, Category, Format, SocialNetwork } from "@/data/content";
import { useContent } from "@/context/ContentContext";
import { RichTextEditor } from "./RichTextEditor";
import { MediaUploader } from "./MediaUploader";
import { logActivity } from "@/lib/activity";

interface PostDrawerProps {
  post: ContentPost | null;
  onClose: () => void;
}

const statuses: PostStatus[] = ["A fazer", "Em produção", "Publicado"];
const statusColors: Record<PostStatus, string> = {
  "A fazer": "bg-muted text-muted-foreground",
  "Em produção": "bg-cat-situacoes/20 text-cat-situacoes",
  "Publicado": "bg-cat-autoridade/20 text-cat-autoridade",
};

const formats: Format[] = ["Reels", "Carrossel", "Story", "Foto", "Vídeo", "Conversão", "Produção", "Lembrete"];
const categories: Category[] = ["Educativo", "Situações Reais", "Autoridade", "Destrave seu Inglês", "Bastidores", "Interação"];
const networks: SocialNetwork[] = ["Instagram", "TikTok", "TikTok + Instagram"];

export const PostDrawer = ({ post, onClose }: PostDrawerProps) => {
  const { updatePost, deletePost, viewMode, ownerId, studentId } = useContent();
  const isAdmin = viewMode === "admin";

  const [title, setTitle] = useState("");
  const [postFormat, setPostFormat] = useState<Format>("Reels");
  const [category, setCategory] = useState<Category>("Educativo");
  const [network, setNetwork] = useState<SocialNetwork>("Instagram");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<PostStatus>("A fazer");
  const [script, setScript] = useState("");
  const [notes, setNotes] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [studentNotes, setStudentNotes] = useState("");
  const [editingScript, setEditingScript] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  // Tabs differ by mode
  const [adminTab, setAdminTab] = useState<"detalhes" | "roteiro" | "midia" | "entrega">("detalhes");
  const [studentTab, setStudentTab] = useState<"conteudo" | "entrega">("conteudo");

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setPostFormat(post.format);
      setCategory(post.category);
      setNetwork(post.network);
      setDate(post.date);
      setStatus(post.status);
      setScript(post.script || "");
      setNotes(post.notes);
      setMediaUrls(post.media_urls || []);
      setPublishedUrl(post.published_url || "");
      setStudentNotes(post.student_notes || "");
      setDirty(false);
      setEditingScript(false);
      setAdminTab("detalhes");
      setStudentTab("conteudo");
    }
  }, [post]);

  if (!post) return null;

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    setSaving(true);
    if (isAdmin) {
      await updatePost(post.id, {
        title, format: postFormat, category, network, date, status, script, notes, media_urls: mediaUrls,
      });
    } else {
      // Student updates: status, link, comment
      const ownerForLog = ownerId || "";
      if (status !== post.status && ownerForLog) {
        await logActivity(post.id, ownerForLog, studentId, "status_changed", { from: post.status, to: status });
      }
      if (publishedUrl !== (post.published_url || "") && ownerForLog && publishedUrl.trim()) {
        await logActivity(post.id, ownerForLog, studentId, "link_added", { url: publishedUrl });
      }
      if (studentNotes !== (post.student_notes || "") && ownerForLog && studentNotes.trim()) {
        await logActivity(post.id, ownerForLog, studentId, "note_added", {});
      }
      await updatePost(post.id, { status, media_urls: mediaUrls, published_url: publishedUrl, student_notes: studentNotes });
    }
    setSaving(false);
    setDirty(false);
  };

  const handleDelete = async () => {
    if (!confirm("Excluir este conteúdo?")) return;
    await deletePost(post.id);
    onClose();
  };

  const handleMediaChange = async (urls: string[]) => {
    setMediaUrls(urls);
    await updatePost(post.id, { media_urls: urls });
    setDirty(false);
  };

  const catColor = categoryConfig[category]?.color || "#999";

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full sm:w-[520px] bg-card border-l border-border shadow-2xl z-50 animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            {isAdmin ? "Editar Conteúdo" : "Conteúdo"}
          </h2>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-destructive" title="Excluir">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {isAdmin
            ? (["detalhes", "roteiro", "midia", "entrega"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setAdminTab(tab)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                    adminTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "midia" ? "Mídia" : tab}
                </button>
              ))
            : (["conteudo", "entrega"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStudentTab(tab)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                    studentTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "conteudo" ? "Conteúdo" : "Entrega"}
                </button>
              ))
          }
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* ===== STUDENT VIEW ===== */}
          {!isAdmin && studentTab === "conteudo" && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white px-2 py-0.5 rounded" style={{ backgroundColor: catColor }}>
                  {postFormat}
                </span>
                <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">{network}</span>
                <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">{category}</span>
                <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">{date}</span>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground leading-tight">{title}</h3>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {statuses.map(s => (
                    <button
                      key={s}
                      onClick={() => { setStatus(s); markDirty(); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        status === s ? statusColors[s] + " ring-2 ring-offset-1 ring-primary/30" : "bg-secondary text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {script && script !== "<p></p>" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Roteiro / Referência</label>
                  <div className="mt-2 rounded-lg border border-border bg-background p-3">
                    <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: script }} />
                  </div>
                </div>
              )}

              {notes && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Observações da professora</label>
                  <p className="mt-2 text-sm text-foreground bg-secondary/50 rounded-lg p-3 whitespace-pre-wrap">{notes}</p>
                </div>
              )}
            </>
          )}

          {!isAdmin && studentTab === "entrega" && (
            <>
              <div>
                <MediaUploader
                  postId={post.id}
                  mediaUrls={mediaUrls}
                  canDelete={false}
                  onChange={handleMediaChange}
                  ownerId={ownerId}
                  studentId={studentId}
                  logAsStudent={true}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Link do post publicado</label>
                <input
                  type="url"
                  value={publishedUrl}
                  onChange={e => { setPublishedUrl(e.target.value); markDirty(); }}
                  placeholder="https://instagram.com/p/..."
                  className="w-full mt-2 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                />
                {publishedUrl && (
                  <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> Abrir
                  </a>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comentário / Anotação</label>
                <textarea
                  value={studentNotes}
                  onChange={e => { setStudentNotes(e.target.value); markDirty(); }}
                  placeholder="Deixe um recado para a professora..."
                  className="w-full mt-2 p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none h-24 focus:ring-2 focus:ring-primary/30 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* ===== ADMIN VIEW ===== */}
          {isAdmin && adminTab === "detalhes" && (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título</label>
                <input
                  value={title}
                  onChange={e => { setTitle(e.target.value); markDirty(); }}
                  className="w-full mt-1 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => { setDate(e.target.value); markDirty(); }}
                  className="w-full mt-1 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Formato</label>
                  <select
                    value={postFormat}
                    onChange={e => { setPostFormat(e.target.value as Format); markDirty(); }}
                    className="w-full mt-1 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                  >
                    {formats.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rede Social</label>
                  <select
                    value={network}
                    onChange={e => { setNetwork(e.target.value as SocialNetwork); markDirty(); }}
                    className="w-full mt-1 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                  >
                    {networks.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => { setCategory(c); markDirty(); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        category === c ? "text-white ring-2 ring-offset-1 ring-primary/30" : "bg-secondary text-muted-foreground hover:bg-muted"
                      }`}
                      style={category === c ? { backgroundColor: categoryConfig[c].color } : {}}
                    >{c}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {statuses.map(s => (
                    <button
                      key={s}
                      onClick={() => { setStatus(s); markDirty(); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        status === s ? statusColors[s] + " ring-2 ring-offset-1 ring-primary/30" : "bg-secondary text-muted-foreground hover:bg-muted"
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas internas</label>
                <textarea
                  value={notes}
                  onChange={e => { setNotes(e.target.value); markDirty(); }}
                  placeholder="Adicione notas sobre este post..."
                  className="w-full mt-2 p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none h-24 focus:ring-2 focus:ring-primary/30 focus:outline-none"
                />
              </div>
            </>
          )}

          {isAdmin && adminTab === "roteiro" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Roteiro</label>
                <button
                  onClick={() => setEditingScript(!editingScript)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                >
                  {editingScript ? <><Eye className="h-3 w-3" /> Visualizar</> : <><Pencil className="h-3 w-3" /> Editar</>}
                </button>
              </div>

              {editingScript ? (
                <RichTextEditor content={script} onChange={html => { setScript(html); markDirty(); }} />
              ) : (
                <div className="rounded-lg border border-border bg-background p-4 min-h-[200px]">
                  {script && script !== "<p></p>" ? (
                    <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: script }} />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nenhum roteiro adicionado. Clique em "Editar" para começar.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {isAdmin && adminTab === "midia" && (
            <MediaUploader
              postId={post.id}
              mediaUrls={mediaUrls}
              canDelete={true}
              onChange={handleMediaChange}
              ownerId={ownerId}
              studentId={studentId}
              logAsStudent={false}
            />
          )}

          {isAdmin && adminTab === "entrega" && (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Link do post publicado</label>
                {publishedUrl ? (
                  <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all">
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" /> {publishedUrl}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground italic mt-2">Aluno ainda não enviou o link.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comentário do aluno</label>
                {studentNotes ? (
                  <p className="mt-2 text-sm text-foreground bg-secondary/50 rounded-lg p-3 whitespace-pre-wrap">{studentNotes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic mt-2">Sem comentários.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer with Save button */}
        <div className="p-4 sm:p-5 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
              dirty ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : dirty ? "Salvar Alterações" : "Salvo"}
          </button>
        </div>
      </div>
    </>
  );
};
