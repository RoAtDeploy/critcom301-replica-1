import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";

export default function OptionList({ type, label, icon: Icon, color }) {
  const { departments, lineManagers, roles, addItem, removeItem, editItem } = useAdmin();
  const items = type === "departments" ? departments : type === "lineManagers" ? lineManagers : roles;

  const [newValue, setNewValue] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  const colorMap = {
    indigo: "bg-primary/10 text-primary",
    teal: "bg-accent/10 text-accent",
    orange: "bg-chart-3/10 text-chart-3",
  };

  const handleAdd = () => {
    if (addItem(type, newValue)) setNewValue("");
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditValue(items[index]);
  };

  const handleEditSave = (index) => {
    editItem(type, items[index], editValue);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{label}</h3>
          <p className="text-xs text-muted-foreground">{items.length} options</p>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item} className="flex items-center gap-2 group">
            {editingIndex === index ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(index); if (e.key === "Escape") setEditingIndex(null); }}
                  className="h-8 text-sm flex-1"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-accent" onClick={() => handleEditSave(index)}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingIndex(null)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1 flex items-center px-3 py-1.5 rounded-md bg-muted/40 border border-border/60 text-sm">
                  {item}
                </div>
                <Button
                  size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleEdit(index)}
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
                <Button
                  size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeItem(type, item)}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder={`Add new ${label.toLowerCase().replace(" options", "")}…`}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          className="h-9 text-sm"
        />
        <Button size="sm" onClick={handleAdd} disabled={!newValue.trim()} className="shrink-0">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}