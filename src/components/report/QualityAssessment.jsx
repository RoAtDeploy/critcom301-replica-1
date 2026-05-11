import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, ChevronDown, ChevronUp, Pencil, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const GRADE_CONFIG = {
  A: { label: "A", color: "bg-emerald-100 text-emerald-700 border-emerald-300", dot: "bg-emerald-500", description: "Competent", tooltip: "High standard of communications: communications protocols followed and evidence of effective non-technical skills such as planning the communication, being clear and concise, challenging where appropriate and actively listening to understand." },
  B: { label: "B", color: "bg-yellow-100 text-yellow-700 border-yellow-300", dot: "bg-yellow-500", description: "Competent with Development", tooltip: "Competent with Development: satisfactory performance but could be improved. Most protocols followed. Satisfactory evidence of summarising, questioning, and repeating back to check understanding." },
  C: { label: "C", color: "bg-orange-100 text-orange-700 border-orange-300", dot: "bg-orange-500", description: "Medium Risk", tooltip: "Medium Risk: performance gives rise to concerns. Some protocols followed but with significant variations and possibility of misunderstanding. Limited or poor non-technical skills such as clarity, listening, questioning and summarising." },
  D: { label: "D", color: "bg-red-100 text-red-700 border-red-300", dot: "bg-red-500", description: "High Risk", tooltip: "High Risk: communications not acceptable. None or very limited attempt to follow communications protocols. Poor or absent non-technical skills resulting in safety being compromised." },
  "n/a": { label: "N/A", color: "bg-slate-100 text-slate-500 border-slate-300", dot: "bg-slate-400", description: "Not Applicable", tooltip: "Not Applicable: this aspect cannot be assessed from this transcript." },
};

const GRADES = ["A", "B", "C", "D", "n/a"];

function GradeBadge({ grade, size = "sm" }) {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG["n/a"];
  const sizeClass = size === "lg" ? "w-8 h-8 text-sm font-bold" : "w-6 h-6 text-xs font-bold";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center justify-center rounded border ${cfg.color} ${sizeClass} shrink-0 cursor-default`}>
          {cfg.label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        <p>{cfg.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function GradeSelector({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {GRADES.map((g) => {
        const cfg = GRADE_CONFIG[g];
        const isSelected = value === g;
        return (
          <Tooltip key={g}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onChange(g)}
                className={`w-8 h-8 text-xs font-bold rounded border-2 transition-all ${
                  isSelected
                    ? `${cfg.color} border-current ring-2 ring-offset-1 ring-current/30`
                    : "bg-background border-border text-muted-foreground hover:border-current/40"
                }`}
              >
                {cfg.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              <p>{cfg.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

function AspectRow({ aspect, onOverride }) {
  const [open, setOpen] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [justification, setJustification] = useState("");
  const [saving, setSaving] = useState(false);

  // For user-scored item (11th), use a direct save mode
  const [userGrade, setUserGrade] = useState(aspect.grade || null);
  const [userReason, setUserReason] = useState(aspect.reasoning || "");
  const [editingUserScore, setEditingUserScore] = useState(!aspect.grade && aspect.user_scored);

  const effectiveGrade = aspect.override?.grade ?? aspect.grade;
  const cfg = GRADE_CONFIG[effectiveGrade] || null;

  const handleSaveOverride = async (grade) => {
    if (!justification.trim()) return;
    setSaving(true);
    await onOverride(aspect.id, grade, justification.trim());
    setOverriding(false);
    setJustification("");
    setSelectedGrade(null);
    setSaving(false);
  };

  const handleRemoveOverride = async () => {
    setSaving(true);
    await onOverride(aspect.id, null, null);
    setOverriding(false);
    setJustification("");
    setSaving(false);
  };

  const handleSaveUserScore = async () => {
    if (!userGrade) return;
    setSaving(true);
    await onOverride(aspect.id, userGrade, userReason.trim(), true);
    setEditingUserScore(false);
    setSaving(false);
  };

  return (
    <div className={`rounded-lg border overflow-hidden ${cfg ? cfg.color.replace("text-", "border-").split(" ")[2] + " border" : "border-slate-200 bg-slate-50"}`}
      style={{ borderColor: undefined }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-3 flex-1 text-left min-w-0">
          {effectiveGrade ? (
            <GradeBadge grade={effectiveGrade} />
          ) : (
            <span className="w-6 h-6 inline-flex items-center justify-center rounded border border-dashed border-slate-300 text-slate-400 text-xs font-bold shrink-0">?</span>
          )}
          <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{aspect.id}.</span>
          <span className="text-sm font-medium text-foreground flex-1 truncate">{aspect.name}</span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {effectiveGrade && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {GRADE_CONFIG[effectiveGrade]?.description}
              {aspect.override && <span className="ml-1 opacity-60">(overridden)</span>}
            </span>
          )}

          {aspect.user_scored ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setEditingUserScore(true); setOpen(true); }}
            >
              <Pencil className="w-3 h-3 mr-1" />
              {effectiveGrade ? "Edit" : "Score"}
            </Button>
          ) : effectiveGrade ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setOverriding(o => !o); setOpen(true); }}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Override
            </Button>
          ) : null}

          <button onClick={() => setOpen(o => !o)}>
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-border/30 space-y-3">
          {/* AI reasoning */}
          {aspect.reasoning && !aspect.user_scored && (
            <p className="text-sm text-foreground/75 leading-relaxed pt-3">{aspect.reasoning}</p>
          )}

          {/* Override justification display */}
          {aspect.override && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 space-y-1">
              <p className="text-xs font-semibold text-amber-700">Override justification</p>
              <p className="text-sm text-amber-800">{aspect.override.justification}</p>
            </div>
          )}

          {/* User-scored item */}
          {aspect.user_scored && editingUserScore && (
            <div className="space-y-3 pt-3">
              <p className="text-xs font-semibold text-foreground">Select a grade for this aspect:</p>
              <GradeSelector value={userGrade} onChange={setUserGrade} />
              <Textarea
                placeholder="Add a reason or note (optional)…"
                className="h-20 resize-none text-sm"
                value={userReason}
                onChange={e => setUserReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveUserScore} disabled={!userGrade || saving} className="text-xs bg-primary hover:bg-primary/90">
                  Save Score
                </Button>
                {effectiveGrade && (
                  <Button size="sm" variant="ghost" onClick={() => setEditingUserScore(false)} className="text-xs">
                    <X className="w-3 h-3 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* User-scored item — display saved score */}
          {aspect.user_scored && !editingUserScore && effectiveGrade && (
            <div className="pt-3 space-y-1">
              {aspect.reasoning && <p className="text-sm text-foreground/75 leading-relaxed">{aspect.reasoning}</p>}
            </div>
          )}

          {/* AI override panel */}
          {!aspect.user_scored && overriding && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-foreground">Select new grade and provide a justification:</p>
              <GradeSelector value={selectedGrade} onChange={setSelectedGrade} />
              <Textarea
                placeholder="Enter reason for override…"
                className="h-20 resize-none text-sm"
                value={justification}
                onChange={e => setJustification(e.target.value)}
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleSaveOverride(selectedGrade)} disabled={!selectedGrade || !justification.trim() || saving} className="text-xs bg-primary hover:bg-primary/90">
                  Save Override
                </Button>
                {aspect.override && (
                  <Button size="sm" variant="outline" onClick={handleRemoveOverride} disabled={saving} className="text-xs">
                    Remove override
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { setOverriding(false); setJustification(""); setSelectedGrade(null); }} className="text-xs">
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

  // Support both new format (aspects) and old format (rules → converted)
  const aspects = assessment?.aspects?.length
    ? assessment.aspects
    : assessment?.rules?.length
    ? assessment.rules.map((r) => ({
        id: r.id,
        name: r.name,
        grade: r.status === 'pass' ? 'A' : r.status === 'fail' ? 'D' : 'n/a',
        reasoning: r.reasoning,
        override: r.override ? {
          grade: r.override.status === 'pass' ? 'A' : r.override.status === 'fail' ? 'D' : 'n/a',
          justification: r.override.justification,
        } : undefined,
      }))
    : null;

  if (!aspects?.length) return null;

  const handleOverride = async (aspectId, newGrade, justification, isUserScored = false) => {
    const updatedAspects = aspects.map((a) => {
      if (a.id !== aspectId) return a;
      if (newGrade === null) {
        const { override, ...rest } = a;
        return rest;
      }
      if (isUserScored) {
        return { ...a, grade: newGrade, reasoning: justification };
      }
      return { ...a, override: { grade: newGrade, justification } };
    });

    const updatedAssessment = { aspects: updatedAspects };
    const saved = await base44.entities.Report.update(report.id, { quality_assessment: updatedAssessment });
    if (onReportUpdate) onReportUpdate(saved);
  };

  // Summary counts (exclude user_scored item 11 from totals)
  const aiAspects = aspects.filter(a => !a.user_scored);
  const gradeCounts = { A: 0, B: 0, C: 0, D: 0 };
  aiAspects.forEach(a => {
    const g = a.override?.grade ?? a.grade;
    if (g && g !== 'n/a' && gradeCounts[g] !== undefined) gradeCounts[g]++;
  });

  return (
    <TooltipProvider delayDuration={200}>
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            Communication Assessment
          </span>
          <div className="flex items-center gap-1.5">
            {Object.entries(gradeCounts).map(([g, count]) => count > 0 && (
              <span key={g} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold ${GRADE_CONFIG[g].color}`}>
                <GradeBadge grade={g} size="xs" />
                ×{count}
              </span>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {aspects.map((aspect) => (
          <AspectRow key={aspect.id} aspect={aspect} onOverride={handleOverride} />
        ))}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}