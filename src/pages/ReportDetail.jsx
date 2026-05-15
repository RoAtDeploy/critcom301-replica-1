import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, FileAudio, User, Briefcase, Calendar, AlignLeft, Phone, Users, CheckCircle2, Sparkles, Send, RefreshCw, ExternalLink, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import ReportStageTracker from "@/components/report/ReportStageTracker";
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
  const [transcriptOpen, setTranscriptOpen] = useState(false);

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

  const handleConfirmAssessment = async () => {
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

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Spoken Safety Critical Communications Monitoring Form</h1>
        <p className="text-muted-foreground mt-1">
          {report.staff_name || "Unknown staff"} · {report.call_date ? new Date(report.call_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "No date"}
          {report.staff_id && (
            <Link to={`/staff/${report.staff_id}`} className="ml-2 text-primary hover:underline text-sm">View Profile →</Link>
          )}
        </p>
      </div>

      {/* Stage Tracker */}
      <ReportStageTracker status={report.status} />

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

      {/* Audio + Transcription */}
      {(report.audio_url || report.transcription_text || report.timestamped_transcript?.length > 0) && (
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            {/* Compact audio player */}
            {report.audio_url && (
              <div className="flex items-center gap-3">
                <FileAudio className="w-4 h-4 text-muted-foreground shrink-0" />
                <audio controls className="flex-1 h-8" style={{ height: "32px" }} src={report.audio_url}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Collapsible transcription */}
            <button
              onClick={() => setTranscriptOpen(o => !o)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
            >
              {transcriptOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
              <span className="font-medium">Transcription</span>
              {!transcriptOpen && report.timestamped_transcript?.length > 0 && (
                <span className="text-xs text-muted-foreground">({report.timestamped_transcript.length} segments)</span>
              )}
            </button>

            {transcriptOpen && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 pt-1 border-t border-border/40">
                {report.timestamped_transcript?.length > 0 ? (
                  report.timestamped_transcript.map((line, idx) => {
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
                  })
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">{report.transcription_text || "No transcription available."}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STAGE 1 — Communication Assessment */}
      <div className={`rounded-xl border-2 transition-colors ${report.status === "draft" ? "border-primary/40 bg-primary/5" : "border-border"}`}>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${report.status !== "draft" ? "bg-accent border-accent text-white" : "bg-primary border-primary text-white"}`}>
              {report.status !== "draft" ? <CheckCircle2 className="w-3.5 h-3.5" /> : "1"}
            </div>
            <h2 className="font-semibold text-sm">Stage 1 — Review Communication Assessment</h2>
          </div>
          {report.status !== "draft" && (
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground h-7" onClick={() => base44.entities.Report.update(id, { status: "draft" }).then(setReport)}>
              <Pencil className="w-3 h-3 mr-1" /> Re-open
            </Button>
          )}
        </div>

        <div className="px-5 pb-5 space-y-4">
          {hasAssessment() ? (
            <>
              <QualityAssessment report={report} onReportUpdate={setReport} />
              {report.status === "draft" && (
                <Button onClick={handleConfirmAssessment} disabled={saving} className="w-full bg-primary hover:bg-primary/90 gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? "Confirming…" : "Confirm Assessment & Proceed to Actions"}
                </Button>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-border bg-background">
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
        </div>
      </div>

      {/* STAGE 2 — Actions & Feedback */}
      <div className={`rounded-xl border-2 transition-colors ${
        report.status === "saved" ? "border-primary/40 bg-primary/5" :
        ["sent","staff_reviewed","signed_off"].includes(report.status) ? "border-border" :
        "border-border opacity-50 pointer-events-none"
      }`}>
        <div className="flex items-center gap-2 px-5 py-4">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${
            ["sent","staff_reviewed","signed_off"].includes(report.status) ? "bg-accent border-accent text-white" :
            report.status === "saved" ? "bg-primary border-primary text-white" :
            "bg-muted border-border text-muted-foreground"
          }`}>
            {["sent","staff_reviewed","signed_off"].includes(report.status) ? <CheckCircle2 className="w-3.5 h-3.5" /> : "2"}
          </div>
          <h2 className="font-semibold text-sm">Stage 2 — Assign Actions & Feedback</h2>
          {report.status === "draft" && <span className="text-xs text-muted-foreground ml-auto">Complete Stage 1 first</span>}
        </div>

        {report.status !== "draft" && (
          <div className="px-5 pb-5 space-y-4">
            <p className="text-xs text-muted-foreground -mt-2">Assign required actions for C/D grades and feedback comments for A/B grades. These reflect any overrides made in Stage 1.</p>
            <ActionItemsEditor report={report} onReportUpdate={setReport} actionTemplates={actionTemplates} />

            {/* Send to staff */}
            <div className="pt-2 border-t border-border/40 space-y-2">
              {report.status === "sent" && (
                <div className="flex items-center gap-2 text-xs text-accent">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sent to {report.staff_email}</span>
                  <a href={`/staff-review/${report.id}`} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground underline">
                    <ExternalLink className="w-3 h-3" /> Preview staff view
                  </a>
                </div>
              )}
              {showEmailInput && (
                <input
                  type="email"
                  placeholder="Staff member email address…"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={staffEmailInput}
                  onChange={e => setStaffEmailInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSendToStaff(); }}
                  autoFocus
                />
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
          </div>
        )}
      </div>


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