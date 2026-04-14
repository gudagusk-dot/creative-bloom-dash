import { useState, useEffect } from "react";
import { X, Instagram, Check, Trash2 } from "lucide-react";
import { ContentPost, categoryConfig, PostStatus, Category, Format, SocialNetwork } from "@/data/content";
import { useContent } from "@/context/ContentContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  const [script, setScript] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setPostFormat(post.format);
      setCategory(post.category);
      setNetwork(post.network);
      setDate(post.date);
      setScript(post.script || "");
      setNotes(post.notes);
    }
  }, [post]);

  if (!post) return null;

  const save = (updates: Partial<ContentPost>) => {
    updatePost(post.id, updates);
  };

  const handleDelete = () => {
    deletePost(post.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full sm:w-[520px] bg-card border-l border-border shadow-2xl z-50 animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Detalhes do Post</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-destructive" title="Excluir">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título</label>
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); save({ title: e.target.value }); }}
              className="w-full mt-1 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</label>
            <input
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); save({ date: e.target.value }); }}
              className="w-full mt-1 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Formato</label>
              <select
                value={postFormat}
                onChange={e => { const v = e.target.value as Format; setPostFormat(v); save({ format: v }); }}
                className="w-full mt-1 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
              >
                {formats.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rede Social</label>
              <select
                value={network}
                onChange={e => { const v = e.target.value as SocialNetwork; setNetwork(v); save({ network: v }); }}
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
                  onClick={() => { setCategory(c); save({ category: c }); }}
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
                  onClick={() => save({ status: s })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    post.status === s ? statusColors[s] + " ring-2 ring-offset-1 ring-primary/30" : "bg-secondary text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Roteiro</label>
            <div className="mt-2">
              <RichTextEditor
                content={script}
                onChange={html => { setScript(html); save({ script: html }); }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas</label>
            <textarea
              value={notes}
              onChange={e => { setNotes(e.target.value); save({ notes: e.target.value }); }}
              placeholder="Adicione notas sobre este post..."
              className="w-full mt-2 p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none h-24 focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-border">
          <button
            onClick={() => save({ status: "Publicado" })}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Check className="h-4 w-4" />
            Marcar como Publicado
          </button>
        </div>
      </div>
    </>
  );
};
