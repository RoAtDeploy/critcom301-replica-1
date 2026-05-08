import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, CheckCircle2, XCircle, MinusCircle, ChevronDown, ChevronUp } from "lucide-react";

const statusConfig = {
  pass: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Pass" },
  fail: { icon: XCircle,      color: "text-red-500",    bg: "bg-red-50",     border: "border-red-200",     label: "Fail" },
  "n/a":{ icon: MinusCircle,  color: "text-slate-400",  bg: "bg-slate-50",   border: "border-slate-200",   label: "N/A"  },
};

function RuleRow({ rule }) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig[rule.status] || statusConfig["n/a"];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
        <span className="text-xs font-bold text-muted-foreground w-7 shrink-0">{rule.id}</span>
        <span className="text-sm font-medium text-foreground flex-1">{rule.name}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.border} ${cfg.color} shrink-0`}>
          {cfg.label}
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />
        }
      </button>
      {open && (
        <div className="px-4 pb-3 pt-0 border-t border-current/10">
          <p className="text-sm text-foreground/75 leading-relaxed">{rule.reasoning}</p>
        </div>
      )}
    </div>
  );
}

export default function QualityAssessment({ report }) {
  const raw = report.quality_assessment;
  const assessment = raw?.response ?? raw;
  if (!assessment?.rules?.length) return null;

  const applicable = assessment.rules.filter(r => r.status !== "n/a");
  const passed = applicable.filter(r => r.status === "pass").length;

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
        {assessment.rules.map((rule) => (
          <RuleRow key={rule.id} rule={rule} />
        ))}
      </CardContent>
    </Card>
  );
}