import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Pencil, X, Save } from "lucide-react";

const DEFAULT_RULES = [
  { aspect_id: "1", aspect_name: "Opens with identification", grade_a_criteria: "Clearly states own name, role, and specific location. Confirms who they are speaking to. All three elements present.", grade_b_criteria: "Identifies themselves with most elements but missing one (e.g. location vague or role omitted).", grade_c_criteria: "Partial identification only — over-familiar, vague, or missing multiple elements.", grade_d_criteria: "No meaningful attempt to identify themselves, who they are calling, or from where.", additional_guidance: "Watch for over-familiarity in repetitive communications and not being specific enough about location." },
  { aspect_id: "2", aspect_name: "States purpose of communication", grade_a_criteria: "Purpose stated clearly and immediately at the outset; no ambiguity.", grade_b_criteria: "Purpose eventually stated but not upfront, or slightly unclear.", grade_c_criteria: "Purpose implied but never explicitly stated; listener may be confused.", grade_d_criteria: "No clear purpose communicated throughout the call.", additional_guidance: "Includes declaring a line blockage, reporting an event, making an emergency call, or testing equipment." },
  { aspect_id: "3", aspect_name: "Structured and logical delivery", grade_a_criteria: "Message flows logically with a clear opening, information exchange, action agreement, and close.", grade_b_criteria: "Mostly structured with minor digressions or elements out of sequence.", grade_c_criteria: "Disorganised delivery; information given out of sequence causing potential confusion.", grade_d_criteria: "Chaotic or incoherent delivery; no logical structure evident.", additional_guidance: "Look for evidence the individual has planned the communication and thought about what they are going to say." },
  { aspect_id: "4", aspect_name: "Accurate and concise delivery", grade_a_criteria: "All information accurate and delivered without unnecessary padding or filler phrases.", grade_b_criteria: "Mostly accurate and concise; minor inaccuracies or slight over-elaboration.", grade_c_criteria: "Some inaccuracies or significant verbosity / filler phrases that risk misunderstanding.", grade_d_criteria: "Inaccurate information given, or delivery so poor accuracy cannot be confirmed.", additional_guidance: "Avoids meaningless phrases like 'I just wanted to tell you' or 'as I said before'. Speaks in chunks of essential information." },
  { aspect_id: "5", aspect_name: "Uses safety-critical protocols (G1)", grade_a_criteria: "Correct protocols used throughout — phonetic alphabet where appropriate, single numbers, 24hr clock, standard phrases.", grade_b_criteria: "Protocols mostly followed with minor lapses (e.g. phonetic alphabet not used once when it should have been).", grade_c_criteria: "Some protocol use but significant gaps or deviations from required procedure.", grade_d_criteria: "No meaningful use of safety-critical communications protocols.", additional_guidance: "Speaks slowly and at a good volume. Uses single numbers for all key information. Uses standard terms and phrases (e.g. 'this is an emergency call')." },
  { aspect_id: "6", aspect_name: "Active listening", grade_a_criteria: "Clear evidence of active listening: no interruptions, uses acknowledgements, reflects back information.", grade_b_criteria: "Generally listens well; minor instances of missing a point or insufficient acknowledgement.", grade_c_criteria: "Listens passively; misses or ignores some information from the other party.", grade_d_criteria: "Does not listen; talks over the other party or misses critical information entirely.", additional_guidance: "Uses acknowledgements (paraphrasing, use of 'uh huh') to indicate they are listening." },
  { aspect_id: "7", aspect_name: "Asks clarifying questions", grade_a_criteria: "Proactively uses open then closed questions; persists until all key information is confirmed.", grade_b_criteria: "Asks some questions but misses opportunities to clarify important points.", grade_c_criteria: "Rarely asks questions; relies on assumptions; accepts vague answers without follow-up.", grade_d_criteria: "No clarifying questions asked; information gaps left entirely unresolved.", additional_guidance: "Uses open questions at the start. Uses closed questions to confirm specifics. Does not accept vague reports." },
  { aspect_id: "8", aspect_name: "Agrees actions and next steps", grade_a_criteria: "Clear, explicit agreement on actions and next steps before closing the call.", grade_b_criteria: "Next steps mentioned but not formally agreed or confirmed by both parties.", grade_c_criteria: "Vague reference to next steps without clear agreement.", grade_d_criteria: "No discussion or agreement on actions or next steps; call ends without conclusion.", additional_guidance: "Only concludes the communication when the next step has been agreed." },
  { aspect_id: "9", aspect_name: "Confirms understanding via repeat-back", grade_a_criteria: "Meaningful repeat-back or summary of critical details; focussed on key points, not monotonous recitation.", grade_b_criteria: "Partial repeat-back; key points summarised but not all critical details covered.", grade_c_criteria: "Attempted repeat-back but incomplete, inaccurate, or merely monotonous recitation without thought.", grade_d_criteria: "No repeat-back or summary of critical details.", additional_guidance: "Avoids monotonous and unnecessary repeat-back; thinks about what they are saying and what it means." },
  { aspect_id: "10", aspect_name: "Challenges errors and omissions", grade_a_criteria: "Actively and confidently challenges any omissions or errors in the other party's communications.", grade_b_criteria: "Challenges one issue but allows others to pass without comment.", grade_c_criteria: "Rarely challenges; accepts incomplete or incorrect communications without query.", grade_d_criteria: "Makes no attempt to challenge errors or omissions in the other party's communications.", additional_guidance: "Prompts / challenges the other party if they do not repeat back. Identifies and corrects errors or inconsistencies." },
];

function RuleRow({ rule, onSave }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(rule);

  const handleSave = () => {
    onSave(rule.id, form);
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 bg-card hover:bg-muted/40 transition-colors text-left"
      >
        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
          {rule.aspect_id}
        </span>
        <span className="flex-1 text-sm font-medium">{rule.aspect_name}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border/40 px-3 pb-3 pt-3 bg-card space-y-3">
          {editing ? (
            <>
              {["grade_a_criteria", "grade_b_criteria", "grade_c_criteria", "grade_d_criteria", "additional_guidance"].map((field) => {
                const labels = { grade_a_criteria: "Grade A Criteria", grade_b_criteria: "Grade B Criteria", grade_c_criteria: "Grade C Criteria", grade_d_criteria: "Grade D Criteria", additional_guidance: "Additional Guidance / Watch-points" };
                return (
                  <div key={field}>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{labels[field]}</label>
                    <Textarea
                      className="mt-1 text-sm resize-none h-16"
                      value={form[field] || ""}
                      onChange={(e) => setForm(f => ({ ...f, [field]: e.target.value }))}
                    />
                  </div>
                );
              })}
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleSave} className="text-xs gap-1.5"><Save className="w-3.5 h-3.5" />Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setForm(rule); setEditing(false); }} className="text-xs gap-1.5"><X className="w-3.5 h-3.5" />Cancel</Button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[["A", rule.grade_a_criteria, "bg-emerald-50 border-emerald-200"], ["B", rule.grade_b_criteria, "bg-yellow-50 border-yellow-200"], ["C", rule.grade_c_criteria, "bg-orange-50 border-orange-200"], ["D", rule.grade_d_criteria, "bg-red-50 border-red-200"]].map(([grade, text, cls]) => (
                  <div key={grade} className={`rounded border p-2 text-xs ${cls}`}>
                    <p className="font-bold mb-0.5">Grade {grade}</p>
                    <p className="text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
              {rule.additional_guidance && (
                <div className="text-xs text-muted-foreground bg-muted/40 rounded p-2">
                  <span className="font-semibold">Watch-points: </span>{rule.additional_guidance}
                </div>
              )}
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="text-xs gap-1.5">
                <Pencil className="w-3.5 h-3.5" />Edit Criteria
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssessmentRulesManager() {
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["assessmentRules"],
    queryFn: () => base44.entities.AssessmentRule.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AssessmentRule.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assessmentRules"] }),
  });

  const seedMutation = useMutation({
    mutationFn: () => base44.entities.AssessmentRule.bulkCreate(DEFAULT_RULES),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assessmentRules"] }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (rules.length === 0) {
    return (
      <div className="text-center py-6 space-y-3">
        <p className="text-sm text-muted-foreground">No assessment rules configured yet.</p>
        <Button size="sm" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
          {seedMutation.isPending ? "Seeding…" : "Load Default Rules"}
        </Button>
      </div>
    );
  }

  const sorted = [...rules].sort((a, b) => Number(a.aspect_id) - Number(b.aspect_id));

  return (
    <div className="space-y-2">
      {sorted.map((rule) => (
        <RuleRow
          key={rule.id}
          rule={rule}
          onSave={(id, data) => updateMutation.mutate({ id, data })}
        />
      ))}
    </div>
  );
}