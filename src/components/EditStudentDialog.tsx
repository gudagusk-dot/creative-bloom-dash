import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStudents, Student } from "@/context/StudentsContext";
import { Loader2, Instagram, MessageCircle } from "lucide-react";
import { TikTokIcon } from "@/components/TikTokIcon";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  student: Student;
}

export const EditStudentDialog = ({ open, onClose, student }: Props) => {
  const { updateStudent } = useStudents();
  const [name, setName] = useState(student.name);
  const [slug, setSlug] = useState(student.slug);
  const [whatsapp, setWhatsapp] = useState(student.whatsapp ?? "");
  const [ig, setIg] = useState(student.instagram_handle ?? "");
  const [tt, setTt] = useState(student.tiktok_handle ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(student.name);
      setSlug(student.slug);
      setWhatsapp(student.whatsapp ?? "");
      setIg(student.instagram_handle ?? "");
      setTt(student.tiktok_handle ?? "");
    }
  }, [open, student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    const { error } = await updateStudent(student.id, {
      name: name.trim(),
      slug: slug.trim() || student.slug,
      whatsapp,
      instagram_handle: ig,
      tiktok_handle: tt,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error);
      return;
    }
    toast.success("Aluno atualizado");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light tracking-tight">Editar aluno</DialogTitle>
          <DialogDescription>
            Atualize os dados do aluno e os @s usados para coletar métricas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1.5 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slug (URL)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full mt-1.5 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
            <p className="text-[11px] text-muted-foreground mt-1">/aluno/{slug || student.slug}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </label>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ex.: 5511999999999"
              className="w-full mt-1.5 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
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
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:shadow-soft-lg hover:-translate-y-0.5 transition-all ease-soft disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar alterações
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
