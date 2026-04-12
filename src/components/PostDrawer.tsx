import { X, Instagram, Check } from "lucide-react";
import { ContentPost, categoryConfig, PostStatus } from "@/data/content";
import { useContent } from "@/context/ContentContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export const PostDrawer = ({ post, onClose }: PostDrawerProps) => {
  const { updatePost } = useContent();

  if (!post) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-card border-l border-border shadow-2xl z-50 animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Detalhes do Post</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título</label>
            <p className="text-foreground font-medium mt-1 text-sm sm:text-base">{post.title}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</label>
            <p className="text-foreground mt-1 capitalize text-sm">
              {format(new Date(post.date + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          <div className="flex gap-3 sm:gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Formato</label>
              <span className="block mt-1 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium w-fit">
                {post.format}
              </span>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria</label>
              <span
                className="block mt-1 px-3 py-1.5 rounded-lg text-sm font-medium text-white w-fit"
                style={{ backgroundColor: categoryConfig[post.category].color }}
              >
                {post.category}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rede Social</label>
            <div className="flex items-center gap-2 mt-1">
              <Instagram className="h-4 w-4 text-cat-bastidores" />
              <span className="text-foreground text-sm">{post.network}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => updatePost(post.id, { status: s })}
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas</label>
            <textarea
              value={post.notes}
              onChange={e => updatePost(post.id, { notes: e.target.value })}
              placeholder="Adicione notas sobre este post..."
              className="w-full mt-2 p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none h-24 focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-border">
          <button
            onClick={() => updatePost(post.id, { status: "Publicado" })}
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
