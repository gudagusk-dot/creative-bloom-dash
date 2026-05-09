import { useState } from "react";
import { X, Trash2, Plus, FileText } from "lucide-react";
import { createPortal } from "react-dom";
import { useTemplates } from "@/hooks/useTemplates";
import { Category, Format, SocialNetwork, FALLBACK_CATEGORY_COLOR } from "@/data/content";

const formats: Format[] = ["Reels", "Carrossel", "Story", "Foto", "Vídeo", "Live", "Conversão", "Produção", "Lembrete"];
const categories: Category[] = ["Educativo", "Situações Reais", "Autoridade", "Destrave seu Inglês", "Bastidores", "Interação"];
const networks: SocialNetwork[] = ["Instagram", "TikTok", "TikTok + Instagram"];

export const TemplatesDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { templates, create, remove } = useTemplates();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Educativo");
  const [postFormat, setPostFormat] = useState<Format>("Reels");
  const [network, setNetwork] = useState<SocialNetwork>("Instagram");
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");

  if (!open) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    await create({ name: name.trim(), category, format: postFormat, network, default_title: title, default_script: script });
    setName(""); setTitle(""); setScript("");
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[100] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[540px] bg-card border-l border-border/60 shadow-soft-xl z-[101] flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-medium text-foreground">Templates</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <div className="space-y-3 p-4 rounded-xl border border-border bg-secondary/30">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Novo template</h3>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome (ex: Reels educativo de 15s)"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none" />
            <div className="flex gap-2">
              <select value={postFormat} onChange={e => setPostFormat(e.target.value as Format)} className="flex-1 p-2.5 rounded-lg border border-border bg-background text-sm">
                {formats.map(f => <option key={f}>{f}</option>)}
              </select>
              <select value={network} onChange={e => setNetwork(e.target.value as SocialNetwork)} className="flex-1 p-2.5 rounded-lg border border-border bg-background text-sm">
                {networks.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full p-2.5 rounded-lg border border-border bg-background text-sm">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título sugerido (opcional)"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm" />
            <textarea value={script} onChange={e => setScript(e.target.value)} placeholder="Roteiro padrão (opcional)" rows={3}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm resize-none" />
            <button onClick={handleCreate} disabled={!name.trim()}
              className="w-full bg-gradient-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              <Plus className="h-4 w-4" /> Adicionar template
            </button>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Salvos ({templates.length})</h3>
            {templates.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum template criado.</p>
            ) : (
              <ul className="space-y-2">
                {templates.map(t => {
                  const color = FALLBACK_CATEGORY_COLOR;
                  return (
                    <li key={t.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background">
                      <span className="w-1 self-stretch rounded-full" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{t.name}</p>
                        <p className="text-[11px] text-muted-foreground">{t.format} · {t.network} · {t.category}</p>
                      </div>
                      <button onClick={() => remove(t.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
