import { useState, useEffect } from "react";
import { X, Trash2, Save, Pencil, Eye } from "lucide-react";
import { ContentPost, categoryConfig, PostStatus, Category, Format, SocialNetwork } from "@/data/content";
import { useContent } from "@/context/ContentContext";
import { RichTextEditor } from "./RichTextEditor";

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

const formats: Format[] = ["Reels", "Carrossel", "Story", "Foto", "Vídeo", "Conversão", "Produção"];
const categories: Category[] = ["Educativo", "Situações Reais", "Autoridade", "Destrave seu Inglês", "Bastidores", "Interação"];
const networks: SocialNetwork[] = ["Instagram", "TikTok", "TikTok + Instagram"];

export const PostDrawer = ({ post, onClose }: PostDrawerProps) => {
  const { updatePost, deletePost } = useContent();
  const [title, setTitle] = useState("");
  const [postFormat, setPostFormat] = useState<Format>("Reels");
  const [category, setCategory] = useState<Category>("Educativo");
  const [network, setNetwork] = useState<SocialNetwork>("Instagram");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<PostStatus>("A fazer");
  const [script, setScript] = useState("");
  const [notes, setNotes] = useState("");
  const [editingScript, setEditingScript] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<"detalhes" | "roteiro">("detalhes");

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
      setDirty(false);
      setEditingScript(false);
      setActiveTab("detalhes");
    }
  }, [post]);

  if (!post) return null;

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    setSaving(true);
    await updatePost(post.id, {
      title, format: postFormat, category, network, date, status, script, notes,
    });
    setSaving(false);
    setDirty(false);
  };

  const handleDelete = async () => {
    await deletePost(post.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full sm:w-[520px] bg-card border-l border-border shadow-2xl z-50 animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Editar Conteúdo</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-destructive" title="Excluir">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("detalhes")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "detalhes"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Detalhes
          </button>
          <button
            onClick={() => setActiveTab("roteiro")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "roteiro"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Roteiro
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === "detalhes" ? (
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
                        category === c
                          ? "text-white ring-2 ring-offset-1 ring-primary/30"
                          : "bg-secondary text-muted-foreground hover:bg-muted"
                      }`}
                      style={category === c ? { backgroundColor: categoryConfig[c].color } : {}}
                    >
                      {c}
                    </button>
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
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas</label>
                <textarea
                  value={notes}
                  onChange={e => { setNotes(e.target.value); markDirty(); }}
                  placeholder="Adicione notas sobre este post..."
                  className="w-full mt-2 p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none h-24 focus:ring-2 focus:ring-primary/30 focus:outline-none"
                />
              </div>
            </>
          ) : (
            /* Roteiro tab */
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
                <RichTextEditor
                  content={script}
                  onChange={html => { setScript(html); markDirty(); }}
                />
              ) : (
                <div className="rounded-lg border border-border bg-background p-4 min-h-[200px]">
                  {script && script !== "<p></p>" ? (
                    <div
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: script }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Nenhum roteiro adicionado. Clique em "Editar" para começar.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Save button */}
        <div className="p-4 sm:p-5 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
              dirty
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
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
