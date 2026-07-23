import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, MessageSquare, AlertTriangle, ChevronDown, ChevronUp, Sparkles, Paperclip, FileText, Headphones, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

const GRADE_CONFIG = {
  A: { color: "bg-emerald-100 text-emerald-700 border-emerald-300", label: "A" },
  B: { color: "bg-yellow-100 text-yellow-700 border-yellow-300", label: "B" },
  C: { color: "bg-orange-100 text-orange-700 border-orange-300", label: "C" },
  D: { color: "bg-red-100 text-red-700 border-red-300", label: "D" },
  "n/a": { color: "bg-slate-100 text-slate-500 border-slate-300", label: "N/A" },
};

function AspectActionRow({ item, actionTemplates, resources, onChange }) {
  const [open, setOpen] = useState(false);
  const grade = item.aspect_grade;
  const isCritical = grade === "C" || grade === "D";
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG["n/a"];
  const includeAI = item.include_ai_feedback !== false; // default true

  return (
    <div className={`rounded-lg border overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <span className={`inline-flex items-center justify-center rounded border w-6 h-6 text-xs font-bold shrink-0 ${cfg.color}`}>
          {cfg.label}
        </span>
        <span className="text-sm font-medium flex-1 truncate">{item.aspect_name}</span>
        {isCritical ? (
          <span className="flex items-center gap-1 text-xs text-orange-600 shrink-0">
            <AlertTriangle className="w-3 h-3" />
            Action required
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <MessageSquare className="w-3 h-3" />
            Feedback
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-border/30 space-y-3 pt-3">

          {/* AI Reasoning preview + toggle */}
          {item.ai_reasoning && (
            <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Sparkles className="w-3 h-3" />
                  AI Feedback
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{includeAI ? "Visible to staff" : "Hidden from staff"}</span>
                  <Switch
                    checked={includeAI}
                    onCheckedChange={(v) => onChange({ ...item, include_ai_feedback: v })}
                  />
                </div>
              </div>
              <p className="text-xs text-foreground/75 leading-relaxed">{item.ai_reasoning}</p>
            </div>
          )}

          {isCritical ? (
            <>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Assign Action (C/D grade)</p>
                <Select
                  value={item.action_type === "predefined" ? item.action : "__custom__"}
                  onValueChange={(val) => {
                    if (val === "__custom__") {
                      onChange({ ...item, action_type: "custom", action: "" });
                    } else {
                      onChange({ ...item, action_type: "predefined", action: val });
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select an action…" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTemplates.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                    <SelectItem value="__custom__">Custom action…</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {item.action_type === "custom" && (
                <Textarea
                  placeholder="Describe the required action…"
                  className="h-20 resize-none text-sm"
                  value={item.action || ""}
                  onChange={(e) => onChange({ ...item, action: e.target.value })}
                />
              )}
            </>
          ) : null}

          <div>
            <p className="text-xs font-semibold text-foreground mb-1.5">
              {isCritical ? "Reviewer Comment (optional)" : "Feedback for Staff Member"}
            </p>
            <Textarea
              placeholder={isCritical ? "Add any additional context for the staff member…" : "Explain what was done well and how to maintain it…"}
              className="h-20 resize-none text-sm"
              value={item.reviewer_comment || ""}
              onChange={(e) => onChange({ ...item, reviewer_comment: e.target.value })}
            />
          </div>

          {resources.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                Attach Resource (optional)
              </p>
              <Select
                value={item.resource_id || "__none__"}
                onValueChange={(val) => {
                  if (val === "__none__") {
                    onChange({ ...item, resource_id: null, resource_title: null, resource_type: null, resource_url: null });
                  } else {
                    const res = resources.find(r => r.id === val);
                    if (res) {
                      const url = res.type === "web_link" ? res.link_url : res.file_url;
                      onChange({ ...item, resource_id: res.id, resource_title: res.title, resource_type: res.type, resource_url: url });
                    }
                  }
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a resource…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No resource</SelectItem>
                  {resources.map(r => {
                    const Icon = r.type === "audio" ? Headphones : r.type === "web_link" ? ExternalLink : FileText;
                    return (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          {r.title}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActionItemsEditor({ report, onReportUpdate, actionTemplates = [] }) {
  const [saving, setSaving] = useState(false);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    base44.entities.Resource.list().then(setResources).catch(() => {});
  }, []);

  const raw = report.quality_assessment;
  const assessment = raw?.response ?? raw;
  const aspects = assessment?.aspects ?? assessment?.rules?.map(r => ({
    id: r.id,
    name: r.name,
    grade: r.status === 'pass' ? 'A' : r.status === 'fail' ? 'D' : 'n/a',
  })) ?? [];

  // Build current action_items indexed by aspect_id
  const existingMap = {};
  (report.action_items || []).forEach(ai => { existingMap[ai.aspect_id] = ai; });

  // Only show aspects that have a real grade (not n/a)
  const relevantAspects = aspects.filter(a => {
    const g = a.override?.grade ?? a.grade;
    return g && g !== "n/a" && !a.user_scored;
  });

  const [items, setItems] = useState(() =>
    relevantAspects.map(a => {
      const g = a.override?.grade ?? a.grade;
      const existing = existingMap[a.id];
      return {
        aspect_id: a.id,
        aspect_name: a.name,
        aspect_grade: g,
        action: "",
        action_type: "predefined",
        reviewer_comment: "",
        ai_reasoning: a.reasoning || "",
        include_ai_feedback: true,
        completed: false,
        staff_comment: "",
        ...(existing || {}),
        // Always keep ai_reasoning in sync with latest assessment
        ai_reasoning: a.reasoning || existing?.ai_reasoning || "",
      };
    })
  );

  const handleChange = (index, updated) => {
    setItems(prev => prev.map((it, i) => i === index ? updated : it));
  };

  const handleSave = async () => {
    setSaving(true);
    const saved = await base44.entities.Report.update(report.id, { action_items: items });
    onReportUpdate(saved);
    setSaving(false);
  };

  if (!relevantAspects.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Run the assessment first to assign actions and feedback.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <AspectActionRow
          key={item.aspect_id}
          item={item}
          actionTemplates={actionTemplates}
          resources={resources}
          onChange={(updated) => handleChange(i, updated)}
        />
      ))}
      <Button
        onClick={handleSave}
        disabled={saving}
        size="sm"
        className="w-full bg-primary hover:bg-primary/90 mt-2"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        {saving ? "Saving…" : "Save Actions & Feedback"}
      </Button>
    </div>
  );
}