import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle, MinusCircle } from "lucide-react";

const gradeColors = {
  "Excellent":         "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Good":              "bg-green-100 text-green-800 border-green-200",
  "Satisfactory":      "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Needs Improvement": "bg-orange-100 text-orange-800 border-orange-200",
  "Unsatisfactory":    "bg-red-100 text-red-800 border-red-200",
};

const statusConfig = {
  pass:     { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Pass" },
  coaching: { icon: AlertTriangle, color: "text-amber-500",  bg: "bg-amber-50 border-amber-200",    label: "Coaching Point" },
  fail:     { icon: XCircle,       color: "text-red-500",    bg: "bg-red-50 border-red-200",         label: "Fail" },
  "n/a":    { icon: MinusCircle,   color: "text-slate-400",  bg: "bg-slate-50 border-slate-200",     label: "N/A" },
};

function ScoreBar({ percentage }) {
  const color =
    percentage >= 90 ? "bg-emerald-500" :
    percentage >= 75 ? "bg-green-500" :
    percentage >= 60 ? "bg-yellow-500" :
    percentage >= 40 ? "bg-orange-500" :
                       "bg-red-500";
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${percentage}%` }} />
    </div>
  );
}

function RuleRow({ rule }) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig[rule.status] || statusConfig["n/a"];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-lg border ${cfg.bg} overflow-hidden`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
        <span className="text-sm font-semibold text-foreground w-8 shrink-0">{rule.id}</span>
        <span className="text-sm font-medium text-foreground flex-1">{rule.name}</span>
        <span className="text-xs font-mono text-muted-foreground mr-2">
          {rule.score === null ? "N/A" : `${rule.score}/${rule.max_score}`}
        </span>
        <Badge variant="outline" className={`text-xs ${cfg.color} border-current shrink-0`}>
          {cfg.label}
        </Badge>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-current/10">
          <p className="text-sm text-foreground/80 leading-relaxed">{rule.reasoning}</p>
        </div>
      )}
    </div>
  );
}

export default function QualityAssessment({ report }) {
  const assessment = report.quality_assessment;

  if (!assessment) return null;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          Quality Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall score block */}
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
          <div className="text-center shrink-0">
            <p className="text-3xl font-bold text-foreground">{assessment.overall_percentage}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {assessment.overall_score} / {assessment.rules?.filter(r => r.score !== null).length} pts
            </p>
          </div>
          <div className="flex-1 space-y-2">
            <Badge
              variant="outline"
              className={`text-xs font-semibold ${gradeColors[assessment.overall_grade] || "bg-muted text-muted-foreground"}`}
            >
              {assessment.overall_grade}
            </Badge>
            <ScoreBar percentage={assessment.overall_percentage} />
            <p className="text-xs text-muted-foreground leading-relaxed">{assessment.summary}</p>
          </div>
        </div>

        {/* Per-rule breakdown */}
        <div className="space-y-2">
          {assessment.rules?.map((rule) => (
            <RuleRow key={rule.id} rule={rule} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}