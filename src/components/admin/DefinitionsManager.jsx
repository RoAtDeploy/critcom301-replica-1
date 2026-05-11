import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

function DefinitionRow({ def, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [term, setTerm] = useState(def.term);
  const [definition, setDefinition] = useState(def.definition);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onEdit(def.id, { term: term.trim(), definition: definition.trim() });
    setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setTerm(def.term);
    setDefinition(def.definition);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
        <Input
          value={term}
          onChange={e => setTerm(e.target.value)}
          placeholder="Abbreviation (e.g. COSS)"
          className="font-mono text-sm font-semibold"
        />
        <Textarea
          value={definition}
          onChange={e => setDefinition(e.target.value)}
          placeholder="Full definition…"
          className="resize-none h-20 text-sm"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={!term.trim() || !definition.trim() || saving} className="text-xs">
            <Check className="w-3 h-3 mr-1" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} className="text-xs">
            <X className="w-3 h-3 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border/50 bg-background px-3 py-2.5 hover:border-border transition-colors">
      <div className="flex-1 min-w-0">
        <span className="font-mono text-xs font-bold text-primary">{def.term}</span>
        <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{def.definition}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
        <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground p-1 rounded">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(def.id)} className="text-muted-foreground hover:text-destructive p-1 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function AddDefinitionForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    await onAdd({ term: term.trim(), definition: definition.trim() });
    setTerm("");
    setDefinition("");
    setOpen(false);
    setSaving(false);
  };

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="w-full text-xs mt-1">
        <Plus className="w-3.5 h-3.5 mr-1" /> Add Definition
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2 mt-1">
      <Input
        value={term}
        onChange={e => setTerm(e.target.value)}
        placeholder="Abbreviation (e.g. COSS)"
        className="font-mono text-sm font-semibold"
        autoFocus
      />
      <Textarea
        value={definition}
        onChange={e => setDefinition(e.target.value)}
        placeholder="Full definition…"
        className="resize-none h-20 text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAdd} disabled={!term.trim() || !definition.trim() || saving} className="text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setTerm(""); setDefinition(""); }} className="text-xs">
          <X className="w-3 h-3 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
}

export default function DefinitionsManager() {
  const [definitions, setDefinitions] = useState([]);

  const load = async () => {
    const data = await base44.entities.IndustryDefinition.list("term");
    setDefinitions(data);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (data) => {
    await base44.entities.IndustryDefinition.create(data);
    await load();
  };

  const handleEdit = async (id, data) => {
    await base44.entities.IndustryDefinition.update(id, data);
    await load();
  };

  const handleDelete = async (id) => {
    await base44.entities.IndustryDefinition.delete(id);
    setDefinitions(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-2">
      {definitions.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">No definitions added yet.</p>
      )}
      {definitions.map(def => (
        <DefinitionRow key={def.id} def={def} onEdit={handleEdit} onDelete={handleDelete} />
      ))}
      <AddDefinitionForm onAdd={handleAdd} />
    </div>
  );
}