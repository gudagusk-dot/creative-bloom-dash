import { useState } from "react";
import { X } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { Category, Format, SocialNetwork, categoryConfig } from "@/data/content";
import { RichTextEditor } from "./RichTextEditor";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NewPostDialogProps {
  open: boolean;
  onClose: () => void;
  initialDate?: string; // YYYY-MM-DD
}

const formats: Format[] = ["Reels", "Carrossel", "Story", "Foto", "Vídeo", "Conversão", "Produção"];
const categories: Category[] = ["Educativo", "Situações Reais", "Autoridade", "Destrave seu Inglês", "Bastidores", "Interação"];
const networks: SocialNetwork[] = ["Instagram", "TikTok", "TikTok + Instagram"];

export const NewPostDialog = ({ open, onClose, initialDate }: NewPostDialogProps) => {
  const { addPost } = useContent();
  const [date, setDate] = useState(initialDate || format(new Date(), "yyyy-MM-dd"));
  const [title, setTitle] = useState("");
  const [postFormat, setPostFormat] = useState<Format>("Reels");
  const [category, setCategory] = useState<Category>("Educativo");
  const [network, setNetwork] = useState<SocialNetwork>("Instagram");
  const [script, setScript] = useState("");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;
    addPost({
      date,
      format: postFormat,
      title: title.trim(),
      category,
      network,
      status: "A fazer",
      notes,
      script,
    });
    onClose();
    // Reset
    setTitle("");
    setScript("");
    setNotes("");
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[520px] bg-card border-l border-border shadow-2xl z-50 animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Novo Conteúdo</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título do post..."
              className="w-full mt-1 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Formato</label>
              <select
                value={postFormat}
                onChange={e => setPostFormat(e.target.value as Format)}
                className="w-full mt-1 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
              >
                {formats.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rede Social</label>
              <select
                value={network}
                onChange={e => setNetwork(e.target.value as SocialNetwork)}
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
                  onClick={() => setCategory(c)}
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Roteiro</label>
            <div className="mt-2">
              <RichTextEditor content={script} onChange={setScript} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas adicionais..."
              className="w-full mt-2 p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none h-20 focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Criar Conteúdo
          </button>
        </div>
      </div>
    </>
  );
};
