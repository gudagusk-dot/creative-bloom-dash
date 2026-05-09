import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStudents } from "@/context/StudentsContext";
import { Loader2, Instagram, MessageCircle } from "lucide-react";
import { TikTokIcon } from "@/components/TikTokIcon";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (slug: string) => void;
}

export const NewStudentDialog = ({ open, onClose, onCreated }: Props) => {
  const { createStudent } = useStudents();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [ig, setIg] = useState("");
  const [tt, setTt] = useState("");
  const [seed, setSeed] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(""); setWhatsapp(""); setIg(""); setTt(""); setSeed(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    const student = await createStudent({
      name,
      whatsapp,
      instagram_handle: ig,
      tiktok_handle: tt,
      seed,
    });
    setSaving(false);
    if (student) {
      onCreated?.(student.slug);
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light tracking-tight">Novo calendário</DialogTitle>
          <DialogDescription>
            Cadastre um aluno e crie um calendário dedicado em branco. As categorias serão criadas conforme você precisar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome do aluno</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Maria Silva"
              className="w-full mt-1.5 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3" /> WhatsApp (opcional)
            </label>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ex.: 5511999999999"
              className="w-full mt-1.5 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Com DDI (55) e DDD.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Instagram className="h-3 w-3" /> Instagram
              </label>
              <div className="relative mt-1.5">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input
                  value={ig}
                  onChange={(e) => setIg(e.target.value)}
                  placeholder="usuario"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Para monitorar seguidores.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TikTokIcon className="h-3 w-3" /> TikTok
              </label>
              <div className="relative mt-1.5">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input
                  value={tt}
                  onChange={(e) => setTt(e.target.value)}
                  placeholder="usuario"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Opcional.</p>
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer select-none border border-dashed border-border rounded-lg p-3">
            <input
              type="checkbox"
              checked={seed}
              onChange={(e) => setSeed(e.target.checked)}
              className="mt-0.5 accent-primary"
            />
            <span className="text-sm text-foreground">
              Importar template de exemplo
              <span className="block text-[11px] text-muted-foreground mt-0.5">
                Cria as 6 categorias padrão e ~30 posts de exemplo. Deixe desmarcado para começar do zero.
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:shadow-soft-lg hover:-translate-y-0.5 transition-all ease-soft disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar calendário
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
