import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Check, X, Mail, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LineManagersManager() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const load = async () => {
    const list = await base44.entities.LineManager.list().catch(() => []);
    setRecords(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!name.trim() || !email.trim()) return;
    const rec = await base44.entities.LineManager.create({ name: name.trim(), email: email.trim() });
    setRecords((prev) => [...prev, rec]);
    setName("");
    setEmail("");
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditName(r.name);
    setEditEmail(r.email);
  };

  const saveEdit = async () => {
    const updated = await base44.entities.LineManager.update(editingId, {
      name: editName.trim(),
      email: editEmail.trim(),
    });
    setRecords((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
    setEditingId(null);
  };

  const remove = async (id) => {
    const lm = records.find((r) => r.id === id);
    await base44.entities.LineManager.delete(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));

    // Cascade: remove this line manager from all staff records (by email or name)
    if (lm) {
      const staff = await base44.entities.StaffMember.list().catch(() => []);
      const updates = staff
        .map((s) => {
          const current = Array.isArray(s.lineManagers) ? s.lineManagers : [];
          const next = current.filter((m) => {
            const emailMatch = lm.email && m.email && m.email.toLowerCase() === lm.email.toLowerCase();
            const nameMatch = lm.name && m.name === lm.name;
            return !(emailMatch || nameMatch);
          });
          const legacyChanged = s.lineManager && s.lineManager === lm.name;
          if (next.length === current.length && !legacyChanged) return null;
          const update = { id: s.id, lineManagers: next };
          if (legacyChanged) update.lineManager = "";
          return update;
        })
        .filter(Boolean);
      if (updates.length) await base44.entities.StaffMember.bulkUpdate(updates);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-chart-3/10 text-chart-3">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Line Managers</h3>
          <p className="text-xs text-muted-foreground">{records.length} line managers</p>
        </div>
      </div>

      <div className="space-y-2">
        {records.map((r) => (
          <div key={r.id} className="flex items-start gap-2 group rounded-md bg-muted/40 border border-border/60 px-3 py-2">
            {editingId === r.id ? (
              <div className="flex flex-col gap-2 w-full">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="h-8 text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="text-accent" onClick={saveEdit}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                    <Mail className="w-3 h-3 shrink-0" />
                    {r.email}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => startEdit(r)}
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => remove(r.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </>
            )}
          </div>
        ))}
        {records.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground py-2">No line managers added yet.</p>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <Input
          placeholder="Name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 text-sm"
          onKeyDown={(e) => { if (e.key === "Enter" && email.trim()) handleAdd(); }}
        />
        <Input
          placeholder="Email address…"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 text-sm"
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleAdd(); }}
        />
        <Button size="sm" onClick={handleAdd} disabled={!name.trim() || !email.trim()} className="self-start">
          <Plus className="w-4 h-4 mr-1" /> Add Line Manager
        </Button>
      </div>
    </div>
  );
}