import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStudents } from "@/context/StudentsContext";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (slug: string) => void;
}

export const NewStudentDialog = ({ open, onClose, onCreated }: Props) => {
  const { createStudent } = useStudents();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [seed, setSeed] = useState(true);
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(""); setWhatsapp(""); setSeed(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    const student = await createStudent({ name, whatsapp, seed });
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
            Cadastre um aluno e crie um calendário dedicado para ele.
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp (opcional)</label>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ex.: 5511999999999"
              className="w-full mt-1.5 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Com DDI (55) e DDD. Usado para o botão de WhatsApp ao compartilhar.</p>
          </div>

          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={seed}
              onChange={(e) => setSeed(e.target.checked)}
              className="mt-0.5 accent-primary"
            />
            <span className="text-sm text-foreground">
              Começar com o template de conteúdos
              <span className="block text-[11px] text-muted-foreground">Desmarque para criar um calendário em branco.</span>
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
