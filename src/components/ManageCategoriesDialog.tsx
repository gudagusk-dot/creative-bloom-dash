import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useContent } from "@/context/ContentContext";
import { Trash2, Check, X, Pencil } from "lucide-react";
import { NewCategoryPopover } from "./NewCategoryPopover";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ManageCategoriesDialog = ({ open, onClose }: Props) => {
  const { categories, updateCategory, deleteCategory, posts } = useContent();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const startEdit = (id: string, name: string, color: string) => {
    setEditingId(id); setEditName(name); setEditColor(color);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateCategory(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
    toast.success("Categoria atualizada");
  };

  const handleDelete = async (id: string, name: string) => {
    const inUse = posts.filter(p => p.category === name).length;
    const msg = inUse > 0
      ? `Excluir "${name}"? ${inUse} post(s) usam esta categoria — eles ficarão sem categoria.`
      : `Excluir "${name}"?`;
    if (!confirm(msg)) return;
    await deleteCategory(id);
    toast.success("Categoria excluída");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-light tracking-tight">Categorias deste calendário</DialogTitle>
          <DialogDescription>
            Cada calendário tem suas próprias categorias. As categorias daqui aparecem ao criar e filtrar conteúdos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2 max-h-[420px] overflow-y-auto">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground italic py-6 text-center">Nenhuma categoria ainda. Crie a primeira abaixo.</p>
          )}
          {categories.map(cat => {
            const editing = editingId === cat.id;
            const inUse = posts.filter(p => p.category === cat.name).length;
            return (
              <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-background">
                {editing ? (
                  <>
                    <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer shrink-0" />
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 p-1.5 rounded border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="p-1.5 rounded text-primary hover:bg-primary/10"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 text-sm font-medium text-foreground">{cat.name}</span>
                    <span className="text-[11px] text-muted-foreground">{inUse} post{inUse === 1 ? "" : "s"}</span>
                    <button onClick={() => startEdit(cat.id, cat.name, cat.color)} className="p-1.5 rounded text-muted-foreground hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-border/60">
          <NewCategoryPopover />
        </div>
      </DialogContent>
    </Dialog>
  );
};
