import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Copy, Check, ExternalLink, MessageCircle, Pencil } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Student } from "@/context/StudentsContext";
import { useStudents } from "@/context/StudentsContext";
import { sanitizeWhatsapp, slugify } from "@/lib/slug";

interface Props {
  open: boolean;
  onClose: () => void;
  student: Student;
}

export const ShareDialog = ({ open, onClose, student }: Props) => {
  const { updateStudent } = useStudents();
  const [copied, setCopied] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugDraft, setSlugDraft] = useState(student.slug);
  const [whatsappDraft, setWhatsappDraft] = useState(student.whatsapp || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const url = `${window.location.origin}/aluno/${student.slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveSlug = async () => {
    const cleaned = slugify(slugDraft);
    if (!cleaned) { setError("Digite um nome válido para o link."); return; }
    setSaving(true);
    setError("");
    const res = await updateStudent(student.id, { slug: cleaned });
    setSaving(false);
    if (res.error) setError(res.error);
    else setEditingSlug(false);
  };

  const saveWhatsapp = async () => {
    setSaving(true);
    await updateStudent(student.id, { whatsapp: whatsappDraft });
    setSaving(false);
  };

  const wppNumber = sanitizeWhatsapp(whatsappDraft || student.whatsapp || "");
  const whatsappUrl = wppNumber
    ? `https://wa.me/${wppNumber}?text=${encodeURIComponent(`Olá ${student.name}! Aqui está o seu calendário de conteúdo: ${url}`)}`
    : `https://wa.me/?text=${encodeURIComponent(`Olá ${student.name}! Aqui está o seu calendário de conteúdo: ${url}`)}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light tracking-tight">Compartilhar com {student.name}</DialogTitle>
          <DialogDescription>
            Envie este link. O aluno acessa direto, sem login, e suas atualizações ficam salvas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Slug editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Link</label>
              {!editingSlug && (
                <button onClick={() => { setSlugDraft(student.slug); setEditingSlug(true); setError(""); }} className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <Pencil className="h-3 w-3" /> editar
                </button>
              )}
            </div>
            {editingSlug ? (
              <div className="space-y-2">
                <div className="flex items-center rounded-lg border border-border bg-background overflow-hidden">
                  <span className="text-xs text-muted-foreground px-2 shrink-0">/aluno/</span>
                  <input
                    value={slugDraft}
                    onChange={(e) => setSlugDraft(e.target.value)}
                    className="flex-1 py-2 pr-2 bg-transparent text-sm text-foreground focus:outline-none"
                    autoFocus
                  />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={saveSlug} disabled={saving} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50">Salvar</button>
                  <button onClick={() => setEditingSlug(false)} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={url}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                />
                <button onClick={handleCopy} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-1.5">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp do aluno</label>
            <div className="flex gap-2 mt-1.5">
              <input
                value={whatsappDraft}
                onChange={(e) => setWhatsappDraft(e.target.value)}
                onBlur={saveWhatsapp}
                placeholder="Ex.: 5511999999999"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Com DDI e DDD para o botão abrir direto na conversa.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              <ExternalLink className="h-4 w-4" />
              Pré-visualizar
            </a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:opacity-90 transition-opacity">
              <MessageCircle className="h-4 w-4" />
              {wppNumber ? "Enviar no WhatsApp" : "WhatsApp"}
            </a>
          </div>

          <div className="flex flex-col items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Ou escaneie o QR Code</span>
            <div className="bg-white p-3 rounded-lg border border-border">
              <QRCodeSVG value={url} size={140} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
