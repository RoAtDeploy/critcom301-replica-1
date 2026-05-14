import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, FileAudio, User, Briefcase, Calendar, AlignLeft, Phone, Users, Save, CheckCircle2, Sparkles, Send, Mail, ClipboardList, BadgeCheck, RefreshCw, ListChecks, ExternalLink } from "lucide-react";
import QualityAssessment from "@/components/report/QualityAssessment";
import ActionItemsEditor from "@/components/report/ActionItemsEditor";
import { useAdmin } from "@/context/AdminContext";
import { motion } from "framer-motion";

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [staffEmailInput, setStaffEmailInput] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const { actionTemplates } = useAdmin();

  useEffect(() => {
    base44.entities.Report.get(id).then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, [id]);

  const hasAssessment = () => {
    const qa = report?.quality_assessment;
    const raw = qa?.response ?? qa;
    return raw?.aspects?.length > 0 || raw?.rules?.length > 0;
  };

  const handleRunAssessment = async () => {
    setAssessing(true);
    const res = await base44.functions.invoke("assessTranscript", {
      transcript: report.timestamped_transcript || report.transcription_text,
      reportId: report.id,
      staffChannel: report.staff_channel,
      staffName: report.staff_name,
      otherRole: report.other_role,
    });
    const updated = await base44.entities.Report.get(report.id);
    setReport(updated);
    setAssessing(false);
  };

  const handleSaveReport = async () => {
    setSaving(true);
    const updated = await base44.entities.Report.update(id, { status: "saved" });
    setReport(updated);
    setSaving(false);
  };

  const handleSendToStaff = async () => {
    const email = staffEmailInput.trim() || report.staff_email;
    if (!email) { setShowEmailInput(true); return; }
    setSendingEmail(true);
    await base44.functions.invoke("sendStaffReviewEmail", {
      reportId: report.id,
      staffEmail: email,
      staffName: report.staff_name,
    });
    const updated = await base44.entities.Report.get(report.id);
    setReport(updated);
    setShowEmailInput(false);
    setSendingEmail(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return <div className="text-center py-20 text-muted-foreground">Report not found.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <Link
        to="/staff"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Staff
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Spoken Safety Critical Communications Monitoring Form</h1>
          <p className="text-muted-foreground mt-1">Full report details for this recorded call.</p>
        </div>
        {report.status === "draft" ? (
          <Button onClick={handleSaveReport} disabled={saving} className="bg-primary hover:bg-primary/90 shrink-0">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving…" : "Save Report"}
          </Button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent capitalize">{report.status?.replace("_", " ")}</span>
            {report.staff_id && (
              <Link to={`/staff/${report.staff_id}`} className="ml-1">
                <Button variant="outline" size="sm">View Profile</Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Call Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow icon={User} label="Staff Member" value={report.staff_name || "—"} />
          <InfoRow icon={Briefcase} label="Role on Site" value={report.role || "—"} />
          <InfoRow icon={Calendar} label="Date of Call" value={report.call_date ? new Date(report.call_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
          <InfoRow icon={Phone} label="Call Type" value={report.call_type || "—"} />
          <InfoRow icon={Clock} label="Duration" value={report.transcription_duration ? `${Math.round(report.transcription_duration)}s` : "—"} />
          <InfoRow icon={FileAudio} label="Language" value={report.transcription_language || "—"} />
          {report.other_role && (
            <InfoRow icon={Users} label="Conversation With" value={report.other_role} />
          )}
          {report.call_context && (
            <div className="sm:col-span-2">
              <InfoRow icon={AlignLeft} label="Context" value={report.call_context} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Call Summary */}
      {report.call_summary && (
        <div className="flex gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80 leading-relaxed">{report.call_summary}</p>
        </div>
      )}

      {/* Workflow */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Report Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Steps */}
          {(() => {
            const statusOrder = ["draft", "saved", "sent", "staff_reviewed", "signed_off"];
            const currentStep = statusOrder.indexOf(report.status ?? "draft");
            const steps = [
              { icon: ClipboardList, label: "Finalise report & actions" },
              { icon: Send,          label: `Send to ${report.staff_name || "staff member"}` },
              { icon: Users,         label: "Awaiting staff review" },
              { icon: BadgeCheck,    label: "Line Manager sign-off" },
            ];
            return (
              <div className="flex items-start gap-1">
                {steps.map(({ icon: Icon, label }, i) => {
                  const done = currentStep > i + 1;
                  const active = currentStep === i + 1;
                  return (
                    <div key={i} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                          done ? "bg-accent border-accent text-accent-foreground" :
                          active ? "bg-primary border-primary text-primary-foreground" :
                          "bg-muted border-border text-muted-foreground"
                        }`}>
                          {done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                        </div>
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground text-center leading-tight">{label}</p>
                      </div>
                      {i < steps.length - 1 && <div className="w-full h-px bg-border mx-1 mb-8 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Send button */}
          {(report.status === "saved" || report.status === "sent") && (
            <div className="space-y-2 pt-1 border-t border-border/40 mt-2">
              {report.status === "sent" && (
                <div className="flex items-center gap-2 text-xs text-accent">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sent to {report.staff_email}</span>
                  <a href={`/staff-review/${report.id}`} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <ExternalLink className="w-3 h-3" /> Preview staff view
                  </a>
                </div>
              )}
              {showEmailInput && (
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Staff member email address…"
                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={staffEmailInput}
                    onChange={e => setStaffEmailInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSendToStaff(); }}
                    autoFocus
                  />
                </div>
              )}
              <Button
                onClick={handleSendToStaff}
                disabled={sendingEmail}
                size="sm"
                variant={report.status === "sent" ? "outline" : "default"}
                className="gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingEmail ? "Sending…" : report.status === "sent" ? "Resend to Staff" : "Send to Staff Member"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions & Feedback */}
      {hasAssessment() && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-muted-foreground" />
              Actions & Feedback
            </CardTitle>
            <p className="text-xs text-muted-foreground">Assign required actions for C/D grades and feedback comments for A/B grades before sending to staff.</p>
          </CardHeader>
          <CardContent>
            <ActionItemsEditor report={report} onReportUpdate={setReport} actionTemplates={actionTemplates} />
          </CardContent>
        </Card>
      )}

      {/* Quality Assessment */}
      {hasAssessment() ? (
        <QualityAssessment report={report} onReportUpdate={setReport} />
      ) : (
        <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-border bg-muted/30">
          <div>
            <p className="text-sm font-medium">Communication Assessment</p>
            <p className="text-xs text-muted-foreground mt-0.5">No assessment has been run for this report yet.</p>
          </div>
          <Button onClick={handleRunAssessment} disabled={assessing} className="bg-primary hover:bg-primary/90 shrink-0 ml-4">
            <RefreshCw className={`w-4 h-4 mr-2 ${assessing ? "animate-spin" : ""}`} />
            {assessing ? "Assessing…" : "Run Assessment"}
          </Button>
        </div>
      )}

      {/* Audio Playback */}
      {report.audio_url && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-muted-foreground" />
              Audio Recording
            </CardTitle>
          </CardHeader>
          <CardContent>
            <audio controls className="w-full" src={report.audio_url}>
              Your browser does not support the audio element.
            </audio>
          </CardContent>
        </Card>
      )}

      {/* Transcription */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileAudio className="w-4 h-4 text-muted-foreground" />
            Transcription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.timestamped_transcript?.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {report.timestamped_transcript.map((line, idx) => {
                const staffInitials = report.staff_name
                  ? report.staff_name.split(" ").map((n) => n[0]).join("").toUpperCase()
                  : "ST";
                const isStaff = report.staff_channel
                  ? (line.speaker === report.staff_channel || line.channel === report.staff_channel)
                  : line.is_staff;
                const speakerLabel = isStaff ? staffInitials : (report.other_role?.toUpperCase() || "?");
                return (
                  <div key={idx} className="flex gap-3 text-sm">
                    <span className="flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 rounded px-2 py-0.5 h-fit whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {line.timestamp}
                    </span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded h-fit whitespace-nowrap ${
                      isStaff ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {speakerLabel}
                    </span>
                    <p className="text-foreground leading-relaxed">{line.text}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">{report.transcription_text || "No transcription available."}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
        <p className="font-medium mt-0.5 text-sm">{value}</p>
      </div>
    </div>
  );
}