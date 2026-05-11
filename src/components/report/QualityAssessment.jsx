import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, CheckCircle2, XCircle, MinusCircle, ChevronDown, ChevronUp, Pencil, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const statusConfig = {
  pass: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Pass" },
  fail: { icon: XCircle,      color: "text-red-500",    bg: "bg-red-50",     border: "border-red-200",     label: "Fail" },
  "n/a":{ icon: MinusCircle,  color: "text-slate-400",  bg: "bg-slate-50",   border: "border-slate-200",   label: "N/A"  },
};

function RuleRow({ rule, reportId, onOverride }) {
  const [open, setOpen] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const [justification, setJustification] = useState("");
  const [saving, setSaving] = useState(false);

  const effectiveStatus = rule.override?.status ?? rule.status;
  const cfg = statusConfig[effectiveStatus] || statusConfig["n/a"];
  const Icon = cfg.icon;

  const oppositeStatus = effectiveStatus === "pass" ? "fail" : "pass";
  const oppositeLabel = oppositeStatus === "pass" ? "Pass" : "Fail";

  const handleSaveOverride = async () => {
    if (!justification.trim()) return;
    setSaving(true);
    await onOverride(rule.id, oppositeStatus, justification.trim());
    setOverriding(false);
    setJustification("");
    setSaving(false);
  };

  const handleCancelOverride = async () => {
    if (!rule.override) { setOverriding(false); return; }
    // Remove existing override
    setSaving(true);
    await onOverride(rule.id, null, null);
    setOverriding(false);
    setJustification("");
    setSaving(false);
  };

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <div className="w-full flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-3 flex-1 text-left min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
          <span className="text-xs font-bold text-muted-foreground w-7 shrink-0">{rule.id}</span>
          <span className="text-sm font-medium text-foreground flex-1 truncate">{rule.name}</span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.border} ${cfg.color}`}>
            {cfg.label}
            {rule.override && <span className="ml-1 opacity-60">(overridden)</span>}
          </span>

          {effectiveStatus !== "n/a" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setOverriding((o) => !o); setOpen(true); }}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Override
            </Button>
          )}

          <button onClick={() => setOpen((o) => !o)}>
            {open
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
            }
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-current/10 space-y-3">
          <p className="text-sm text-foreground/75 leading-relaxed pt-3">{rule.reasoning}</p>

          {rule.override && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 space-y-1">
              <p className="text-xs font-semibold text-amber-700">Override justification</p>
              <p className="text-sm text-amber-800">{rule.override.justification}</p>
            </div>
          )}

          {overriding && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-foreground">
                Override to <span className={oppositeStatus === "pass" ? "text-emerald-600" : "text-red-500"}>{oppositeLabel}</span> — provide a justification:
              </p>
              <Textarea
                placeholder="Enter reason for override…"
                className="h-20 resize-none text-sm"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveOverride}
                  disabled={!justification.trim() || saving}
                  className="text-xs"
                >
                  {saving ? "Saving…" : `Set to ${oppositeLabel}`}
                </Button>
                {rule.override && (
                  <Button size="sm" variant="outline" onClick={handleCancelOverride} disabled={saving} className="text-xs">
                    Remove override
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { setOverriding(false); setJustification(""); }} className="text-xs">
                  <X className="w-3 h-3 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function QualityAssessment({ report, onReportUpdate }) {
  const raw = report.quality_assessment;
  const assessment = raw?.response ?? raw;
  if (!assessment?.rules?.length) return null;

  const rules = assessment.rules;

  const handleOverride = async (ruleId, newStatus, justification) => {
    const updatedRules = rules.map((r) => {
      if (r.id !== ruleId) return r;
      if (newStatus === null) {
        const { override, ...rest } = r;
        return rest;
      }
      return { ...r, override: { status: newStatus, justification } };
    });

    const updatedAssessment = { ...assessment, rules: updatedRules };
    const saved = await base44.entities.Report.update(report.id, { quality_assessment: updatedAssessment });
    if (onReportUpdate) onReportUpdate(saved);
  };

  const applicable = rules.filter(r => (r.override?.status ?? r.status) !== "n/a");
  const passed = applicable.filter(r => (r.override?.status ?? r.status) === "pass").length;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            Rule Compliance
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {passed} / {applicable.length} passed
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rules.map((rule) => (
          <RuleRow key={rule.id} rule={rule} reportId={report.id} onOverride={handleOverride} />
        ))}
      </CardContent>
    </Card>
  );
}