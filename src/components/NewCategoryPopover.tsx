import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Plus, Loader2 } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#00BCD4", "#FFC107", "#4CAF50", "#E91E8C", "#7B1FA2", "#FF5722",
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899",
  "#14B8A6", "#F97316", "#84CC16", "#06B6D4",
];

interface Props {
  /** Called after the new category is created with the selected name. */
  onCreated?: (name: string) => void;
  trigger?: React.ReactNode;
}

export const NewCategoryPopover = ({ onCreated, trigger }: Props) => {
  const { addCategory } = useContent();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const cat = await addCategory(name, color);
    setSaving(false);
    if (cat) {
      toast.success(`Categoria "${cat.name}" criada`);
      onCreated?.(cat.name);
      setName("");
      setColor(PRESET_COLORS[0]);
      setOpen(false);
    } else {
      toast.error("Não foi possível criar");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <button
            type="button"
            className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Nova categoria
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nome</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
              placeholder="Ex.: Promoções"
              className="w-full mt-1 p-2 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cor</label>
            <div className="grid grid-cols-8 gap-1.5 mt-1.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-md transition-transform ${color === c ? "ring-2 ring-offset-1 ring-foreground scale-110" : "hover:scale-110"}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-2 w-full h-8 rounded cursor-pointer"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || saving}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Criar categoria
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
