import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, AlertTriangle, Power } from "lucide-react";

const SEVERITY_COLORS = {
  low: "bg-yellow-100 text-yellow-700 border-yellow-300",
  medium: "bg-orange-100 text-orange-700 border-orange-300",
  high: "bg-red-100 text-red-700 border-red-300",
};

const CATEGORY_COLORS = {
  profanity: "bg-pink-100 text-pink-700",
  safety: "bg-blue-100 text-blue-700",
  aggression: "bg-red-100 text-red-700",
  keyword: "bg-slate-100 text-slate-600",
};

export default function AlertTriggersManager() {
  const queryClient = useQueryClient();
  const [newPhrase, setNewPhrase] = useState("");
  const [newSeverity, setNewSeverity] = useState("medium");
  const [newCategory, setNewCategory] = useState("keyword");
  const [adding, setAdding] = useState(false);

  const { data: triggers = [], isLoading } = useQuery({
    queryKey: ["alertTriggers"],
    queryFn: () => base44.entities.AlertTrigger.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AlertTrigger.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alertTriggers"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AlertTrigger.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alertTriggers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AlertTrigger.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alertTriggers"] }),
  });

  const handleAdd = async () => {
    if (!newPhrase.trim()) return;
    await createMutation.mutateAsync({ phrase: newPhrase.trim(), severity: newSeverity, category: newCategory, enabled: true });
    setNewPhrase("");
    setNewSeverity("medium");
    setNewCategory("keyword");
    setAdding(false);
  };

  const toggleEnabled = (trigger) => {
    updateMutation.mutate({ id: trigger.id, data: { enabled: !trigger.enabled } });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-3">
      {triggers.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No alert triggers configured.</p>
      )}

      <div className="space-y-2">
        {triggers.map((trigger) => (
          <div
            key={trigger.id}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-opacity ${!trigger.enabled ? "opacity-50" : ""} ${SEVERITY_COLORS[trigger.severity] || "border-border"}`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 font-medium">{trigger.phrase}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${CATEGORY_COLORS[trigger.category]}`}>
              {trigger.category}
            </span>
            <Badge variant="outline" className={`text-xs capitalize border ${SEVERITY_COLORS[trigger.severity]}`}>
              {trigger.severity}
            </Badge>
            <button
              onClick={() => toggleEnabled(trigger)}
              title={trigger.enabled ? "Disable trigger" : "Enable trigger"}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => deleteMutation.mutate(trigger.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
          <Input
            placeholder="Enter word or phrase…"
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <div className="flex gap-2">
            <Select value={newSeverity} onValueChange={setNewSeverity}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low severity</SelectItem>
                <SelectItem value="medium">Medium severity</SelectItem>
                <SelectItem value="high">High severity</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profanity">Profanity</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="aggression">Aggression</SelectItem>
                <SelectItem value="keyword">Keyword</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!newPhrase.trim() || createMutation.isPending} className="text-xs">
              Add Trigger
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)} className="text-xs">Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Trigger
        </Button>
      )}
    </div>
  );
}