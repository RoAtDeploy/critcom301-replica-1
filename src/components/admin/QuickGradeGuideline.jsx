import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, RotateCcw } from "lucide-react";

const DEFAULT_GUIDELINE = `Assign a quick overall grade (A, B, C, D, X, or n/a) based on the staff member's communication performance in this call.

Grade A: High standard throughout. Protocols fully followed. Strong identification, clear purpose, structured delivery, active listening, and appropriate use of safety-critical language.
Grade B: Satisfactory performance with minor gaps. Most protocols followed. Some missed opportunities to clarify or confirm, but no significant safety concern.
Grade C: Performance gives concern. Significant protocol variations or limited non-technical skills. Possible misunderstanding risk.
Grade D: Unacceptable communications. Little or no protocol adherence. Safety may be compromised. Assign D if alert-flagged content is present (profanity, aggression, dangerous miscommunication).
Grade X: Not safety-critical in nature. No work-related instructions or important information conveyed. Applies to wrong numbers, personal calls, calls with no meaningful dialogue, or general conversation where no safety-critical content is present. Do NOT grade X calls as A-D.
n/a: Cannot be assessed — transcript too short, silent, unintelligible, or recording failed.

Prioritise safety protocol adherence above all else. If you are unsure between two grades, assign the lower one. Always assign X before n/a if the call is intelligible but simply not safety-critical.`;

export default function QuickGradeGuideline() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [dirty, setDirty] = useState(false);

  const { data: configs = [] } = useQuery({
    queryKey: ["adminConfig", "quickGradeGuideline"],
    queryFn: () => base44.entities.AdminConfig.filter({ key: "quickGradeGuideline" }),
  });

  const existing = configs[0];

  useEffect(() => {
    if (existing) {
      setText(existing.values?.[0] || DEFAULT_GUIDELINE);
    } else {
      setText(DEFAULT_GUIDELINE);
    }
    setDirty(false);
  }, [existing?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (existing) {
        return base44.entities.AdminConfig.update(existing.id, { values: [text] });
      } else {
        return base44.entities.AdminConfig.create({ key: "quickGradeGuideline", values: [text] });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminConfig", "quickGradeGuideline"] });
      setDirty(false);
    },
  });

  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setDirty(true); }}
        className="min-h-[200px] text-sm font-mono resize-y"
        placeholder="Enter grading guideline…"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
          className="text-xs gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          {saveMutation.isPending ? "Saving…" : "Save Guideline"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { setText(DEFAULT_GUIDELINE); setDirty(true); }}
          className="text-xs gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
        </Button>
      </div>
    </div>
  );
}