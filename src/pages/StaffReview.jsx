import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, MessageSquare, ShieldCheck, Sparkles, User, Calendar, Phone, Loader2, PenLine } from "lucide-react";
import SignaturePad from "@/components/report/SignaturePad";

const GRADE_CONFIG = {
  A: { color: "bg-emerald-100 text-emerald-700 border-emerald-300", label: "A", description: "No Action Required" },
  B: { color: "bg-yellow-100 text-yellow-700 border-yellow-300", label: "B", description: "Feedback" },
  C: { color: "bg-orange-100 text-orange-700 border-orange-300", label: "C", description: "Action Required" },
  D: { color: "bg-red-100 text-red-700 border-red-300", label: "D", description: "Immediate Action Required" },
};

function WorkflowStep({ number, label, active, done }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
        done ? "bg-accent border-accent text-accent-foreground" :
        active ? "bg-primary border-primary text-primary-foreground" :
        "bg-muted border-border text-muted-foreground"
      }`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : number}
      </div>
      <p className="text-xs text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  );
}

export default function StaffReview() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [signature, setSignature] = useState(null);

  useEffect(() => {
    base44.functions.invoke("staffReviewReport", { reportId: id, action: "get" }).then((res) => {
      const r = res.data.report;
      setReport(r);
      setItems((r.action_items || []).map(ai => ({ ...ai })));
      setLoading(false);
      if (r.status === "staff_reviewed" || r.status === "signed_off") {
        setSubmitted(true);
      }
    });
  }, [id]);

  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await base44.functions.invoke("staffReviewReport", { reportId: id, action: "submit", items, signature });
    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Report not found.
      </div>
    );
  }

  const feedbackItems = items.filter(i => i.aspect_grade === "A" || i.aspect_grade === "B");
  const actionItems = items.filter(i => i.aspect_grade === "C" || i.aspect_grade === "D");
  const allActionsAcknowledged = actionItems.every(item => item.completed);
  const workflowStep = report.status === "signed_off" ? 4 : report.status === "staff_reviewed" ? 3 : 2;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">CritCon301</p>
            <p className="text-xs text-muted-foreground mt-0.5">Safety-Critical Communications Monitoring</p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto px-4 py-6 space-y-6"
      >
        <div>
          <h1 className="text-xl font-bold">Your Monitoring Report</h1>
          <p className="text-muted-foreground text-sm mt-1">Please review the feedback below and confirm any required actions.</p>
        </div>

        {/* Workflow */}
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              {[
                { n: "1", label: "Report finalised" },
                { n: "2", label: "Sent to you" },
                { n: "3", label: "Your review" },
                { n: "4", label: "Manager sign-off" },
              ].map(({ n, label }, i) => (
                <div key={n} className="flex items-center flex-1">
                  <WorkflowStep number={n} label={label} active={workflowStep === i + 1} done={workflowStep > i + 1} />
                  {i < 3 && <div className="w-full h-px bg-border mx-1 mb-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call info */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Call Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Staff:</span>
              <span className="font-medium">{report.staff_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{report.call_date ? new Date(report.call_date).toLocaleDateString("en-GB") : "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{report.call_type || "-"}</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Summary */}
        {report.call_summary && (
          <div className="flex gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80 leading-relaxed">{report.call_summary}</p>
          </div>
        )}

        {/* Feedback (A/B) */}
        {feedbackItems.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                Feedback
              </CardTitle>
              <p className="text-xs text-muted-foreground">These aspects of your communication were assessed as satisfactory or above. Review the feedback from your line manager.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {feedbackItems.map((item) => {
                const cfg = GRADE_CONFIG[item.aspect_grade];
                return (
                  <div key={item.aspect_id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center rounded border w-6 h-6 text-xs font-bold shrink-0 ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-sm font-medium">{item.aspect_name}</span>
                    </div>
                    {item.include_ai_feedback !== false && item.ai_reasoning && (
                      <div className="flex gap-2 pl-8">
                        <Sparkles className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-foreground/70 leading-relaxed">{item.ai_reasoning}</p>
                      </div>
                    )}
                    {item.reviewer_comment && (
                      <p className="text-sm text-foreground/75 leading-relaxed pl-8">{item.reviewer_comment}</p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Actions (C/D) */}
        {actionItems.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Required Actions
              </CardTitle>
              <p className="text-xs text-muted-foreground">These items require you to take action. Please read each one, mark it as completed, and add a comment if needed.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionItems.map((item) => {
                const itemIndex = items.findIndex(it => it.aspect_id === item.aspect_id);
                const cfg = GRADE_CONFIG[item.aspect_grade];
                return (
                  <div key={item.aspect_id} className={`rounded-lg border p-4 space-y-3 ${submitted ? "opacity-75" : ""}`}>
                    <div className="flex items-start gap-2">
                      <span className={`inline-flex items-center justify-center rounded border w-6 h-6 text-xs font-bold shrink-0 mt-0.5 ${cfg.color}`}>{cfg.label}</span>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{item.aspect_name}</p>
                        {item.include_ai_feedback !== false && item.ai_reasoning && (
                          <div className="flex gap-1.5">
                            <Sparkles className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-foreground/70 leading-relaxed">{item.ai_reasoning}</p>
                          </div>
                        )}
                        {item.reviewer_comment && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.reviewer_comment}</p>
                        )}
                      </div>
                    </div>
                    {item.action && (
                      <div className="rounded-md bg-orange-50 border border-orange-200 px-3 py-2">
                        <p className="text-xs font-semibold text-orange-700 mb-0.5">Required action</p>
                        <p className="text-sm text-orange-800">{item.action}</p>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`complete-${item.aspect_id}`}
                        checked={item.completed}
                        disabled={submitted}
                        onCheckedChange={(checked) => handleItemChange(itemIndex, "completed", checked)}
                        className="mt-0.5"
                      />
                      <label htmlFor={`complete-${item.aspect_id}`} className="text-sm font-medium cursor-pointer">
                        I confirm I have read and understood this action
                      </label>
                    </div>
                    <Textarea
                      placeholder="Add your comments (optional)"
                      className="h-16 resize-none text-sm"
                      value={item.staff_comment || ""}
                      disabled={submitted}
                      onChange={(e) => handleItemChange(itemIndex, "staff_comment", e.target.value)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Signature */}
        {!submitted && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PenLine className="w-4 h-4 text-muted-foreground" />
                Signature
              </CardTitle>
              <p className="text-xs text-muted-foreground">By signing below, you confirm you have read and acknowledged all feedback and actions in this report.</p>
            </CardHeader>
            <CardContent>
              <SignaturePad onChange={setSignature} />
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        {!submitted ? (
          <div>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !signature || !allActionsAcknowledged}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {submitting ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</span>
              ) : (
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Confirm and Submit</span>
              )}
            </Button>
            {actionItems.length > 0 && !allActionsAcknowledged && (
              <p className="text-xs text-center text-orange-600 mt-2">Please acknowledge all required actions before submitting.</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 p-6 rounded-xl bg-accent/10 border border-accent/30">
            <CheckCircle2 className="w-6 h-6 text-accent" />
            <div>
              <p className="font-semibold text-accent">Review submitted</p>
              <p className="text-sm text-muted-foreground">Your line manager has been notified. No further action is required from you at this stage.</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}