import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Copy, Check, ExternalLink, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  open: boolean;
  onClose: () => void;
  ownerId: string;
}

export const ShareDialog = ({ open, onClose, ownerId }: Props) => {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/aluno/${ownerId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Olá! Aqui está o seu calendário de conteúdo: ${url}`
  )}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar com o aluno</DialogTitle>
          <DialogDescription>
            Envie este link para seu aluno. Ele poderá ver o calendário, marcar status e enviar mídias — sem precisar de login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-1.5"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Pré-visualizar
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
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
