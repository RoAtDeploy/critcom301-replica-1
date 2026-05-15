import { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, Shield, Radio, FileText, Settings2, BrainCircuit, AlertTriangle, ListChecks, Users, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Section = ({ icon: Icon, title, color, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-card hover:bg-muted/40 transition-colors text-left"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-base flex-1">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 pt-3 space-y-3 bg-card border-t border-border/40">{children}</div>}
    </div>
  );
};

const Step = ({ number, title, description }) => (
  <div className="flex gap-3">
    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
      {number}
    </div>
    <div>
      <p className="font-medium text-sm">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
    </div>
  </div>
);

const InfoBox = ({ title, children, variant = "info" }) => {
  const styles = {
    info: "bg-primary/5 border-primary/20 text-primary",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    tip: "bg-emerald-50 border-emerald-200 text-emerald-800",
  };
  return (
    <div className={`rounded-lg border p-3 text-sm ${styles[variant]}`}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div className="text-current/80">{children}</div>
    </div>
  );
};

const GradeBadge = ({ grade, label }) => {
  const colors = {
    A: "bg-emerald-100 text-emerald-700 border-emerald-300",
    B: "bg-yellow-100 text-yellow-700 border-yellow-300",
    C: "bg-orange-100 text-orange-700 border-orange-300",
    D: "bg-red-100 text-red-700 border-red-300",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-semibold ${colors[grade]}`}>
      <span className="font-bold">{grade}</span> — {label}
    </span>
  );
};

export default function UserGuide() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Guide</h1>
          <p className="text-muted-foreground mt-1">
            A complete guide to using CritCom301 — from uploading recordings to understanding AI-generated assessments and configuring system behaviour.
          </p>
        </div>
      </div>

      {/* Overview */}
      <Section icon={BarChart2} title="Overview — What is CritCom301?" color="bg-primary">
        <p className="text-sm text-muted-foreground">
          CritCom301 is a communications quality monitoring platform designed for railway operations. It automates the review of staff radio and telephone communications, using AI to transcribe calls, grade performance, flag issues, and generate detailed feedback reports — all aligned with Rule Book Section G1 protocols.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <InfoBox title="Core Workflow">
            <ol className="space-y-1 list-decimal list-inside text-xs">
              <li>Upload a call recording</li>
              <li>AI transcribes and grades the call</li>
              <li>Reviewer assesses and assigns actions</li>
              <li>Report sent to staff member</li>
              <li>Staff reviews and acknowledges</li>
            </ol>
          </InfoBox>
          <InfoBox title="Key Features">
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li>Bulk monitoring via "Monitoring on Mass"</li>
              <li>10-aspect detailed quality assessment</li>
              <li>Action item assignment and tracking</li>
              <li>Staff self-review workflow</li>
              <li>Admin-configurable AI behaviour</li>
            </ul>
          </InfoBox>
        </div>
      </Section>

      {/* Grading Scale */}
      <Section icon={BarChart2} title="Understanding the Grading Scale" color="bg-violet-500">
        <p className="text-sm text-muted-foreground">The AI uses a four-tier grading system aligned to Rule Book Section G1:</p>
        <div className="space-y-2 mt-1">
          <div className="flex items-start gap-3">
            <GradeBadge grade="A" label="Competent" />
            <p className="text-sm text-muted-foreground">High standard of communication. All protocols followed. Strong non-technical skills throughout. <strong>No action required.</strong></p>
          </div>
          <div className="flex items-start gap-3">
            <GradeBadge grade="B" label="Competent with Development" />
            <p className="text-sm text-muted-foreground">Satisfactory but could be improved. Most protocols followed. Minor gaps. <strong>Feedback required.</strong></p>
          </div>
          <div className="flex items-start gap-3">
            <GradeBadge grade="C" label="Medium Risk" />
            <p className="text-sm text-muted-foreground">Performance gives cause for concern. Significant protocol variations. Limited non-technical skills. <strong>Development Action Plan required.</strong></p>
          </div>
          <div className="flex items-start gap-3">
            <GradeBadge grade="D" label="High Risk" />
            <p className="text-sm text-muted-foreground">Communications not acceptable. Little or no protocol adherence. Safety may be compromised. <strong>Immediate action required.</strong></p>
          </div>
        </div>
        <InfoBox variant="tip" title="Grade Overrides">
          If you disagree with the AI's grade on a recording in Monitoring on Mass, use the <strong>Override</strong> button to manually set a grade and provide a written justification. This is logged and visible to reviewers.
        </InfoBox>
      </Section>

      {/* Staff Management */}
      <Section icon={Users} title="Managing Staff Members" color="bg-teal-500">
        <div className="space-y-3">
          <Step number="1" title="Adding a Staff Member" description='Navigate to "Staff Members" in the sidebar and click "Add Staff". Fill in name, Sentinel ID, email, department, roles, and line manager.' />
          <Step number="2" title="Editing Staff Profiles" description="Click on any staff member to view their profile. Use the edit icon next to any field to update their information." />
          <Step number="3" title="Bulk Import via CSV" description='On the Staff Members page, use the "Import CSV" button to upload a spreadsheet. Download the template first to ensure the correct format.' />
          <Step number="4" title="Staff Status" description='Staff can be set as "Active" or "Under Review". Under Review status is highlighted in orange across the system.' />
        </div>
        <InfoBox variant="tip">
          Staff members must be added to the system before recordings can be assigned to them during bulk processing.
        </InfoBox>
      </Section>

      {/* Monitoring on Mass */}
      <Section icon={Radio} title="Monitoring on Mass — Bulk Recording Analysis" color="bg-orange-500">
        <p className="text-sm text-muted-foreground">The Monitoring on Mass screen lets you upload and analyse multiple recordings simultaneously.</p>
        <div className="space-y-3 mt-1">
          <Step number="1" title="Upload Recordings" description="Drag and drop audio files onto the upload area, or click to browse. Multiple files can be uploaded at once." />
          <Step number="2" title="Assign Staff Members" description="Use the dropdown on each recording row to assign it to a known staff member." />
          <Step number="3" title="Processing" description="Each file is automatically transcribed and graded. A spinning indicator shows files still being processed." />
          <Step number="4" title="Review Results" description="Expand any row to see the full transcript, playback audio, and view the AI-assigned grade with reasoning." />
          <Step number="5" title="Override Grades" description='If the AI grade is incorrect, click "Override" to set a manual grade with a written justification.' />
          <Step number="6" title="Generate Full Report" description='For recordings needing detailed review, click "Generate Full Report" to create a 10-aspect quality assessment report.' />
        </div>
        <InfoBox variant="warning" title="Recording Expiry">
          Recordings are retained for 90 days. An expiry countdown is shown on each row. Recordings approaching expiry (within 30 days) are highlighted amber; within 14 days, red.
        </InfoBox>
        <div className="mt-2">
          <p className="text-sm font-medium mb-1">Alert Flags</p>
          <p className="text-sm text-muted-foreground">If the AI detects alert-worthy content (e.g. profanity, dangerous miscommunication, aggression), a red <strong>⚠</strong> flag icon appears on the recording row. Hover over it to see the specific issue detected. The words and phrases that trigger alerts are configurable by admins — see the <em>AI Controls</em> section below.</p>
        </div>
      </Section>

      {/* Generate Report */}
      <Section icon={FileText} title="Generating Detailed Reports" color="bg-blue-500">
        <p className="text-sm text-muted-foreground">Detailed reports provide a full 10-aspect quality assessment of a staff member's call performance.</p>
        <div className="space-y-3 mt-1">
          <Step number="1" title="Start a Report" description='Navigate to "Generate Report" in the sidebar, or click "Generate Full Report" from a monitoring row.' />
          <Step number="2" title="Upload or Use Existing Audio" description="Upload a new audio file or select a previously processed recording." />
          <Step number="3" title="Review Transcript" description="Once transcribed, check the transcript and assign speaker labels (Staff / Other) to each segment." />
          <Step number="4" title="Enter Call Details" description="Fill in the call date, call type, staff member details, and context notes." />
          <Step number="5" title="Run AI Assessment" description="The AI will assess all 10 communication aspects based on the transcript, producing a grade and detailed reasoning for each." />
          <Step number="6" title="Aspect 11 — Manual Score" description="The final aspect (completing documentation) must be manually graded by the reviewer as it cannot be assessed from audio." />
          <Step number="7" title="Assign Action Items" description="For C and D graded aspects, assign a corrective action (from templates or custom), add a reviewer comment, and confirm." />
          <Step number="8" title="Send to Staff" description='Once satisfied, click "Send to Staff" to email the report to the staff member for self-review.' />
        </div>
        <InfoBox variant="tip" title="Re-running the Assessment">
          If you update the transcript or call context and need a fresh AI assessment, use the "Re-run Assessment" option from the report detail page.
        </InfoBox>
      </Section>

      {/* Staff Review Workflow */}
      <Section icon={ListChecks} title="Staff Review Workflow" color="bg-emerald-500">
        <p className="text-sm text-muted-foreground">After a report is sent, the staff member receives an email with a secure link to review their feedback.</p>
        <div className="space-y-3 mt-1">
          <Step number="1" title="Staff Receives Email" description="The email contains a direct link to their report — no login required." />
          <Step number="2" title="Review Feedback" description="Staff can see the AI-assessed grades, the reviewer's reasoning, and any assigned action items." />
          <Step number="3" title="Acknowledge Actions" description="For each required action, the staff member ticks a confirmation box to acknowledge the requirement." />
          <Step number="4" title="Add Comments" description="Staff can add optional written comments against individual actions or the report as a whole." />
          <Step number="5" title="Submit Review" description='Clicking "Submit Review" marks the report as "Staff Reviewed" and notifies the reviewer.' />
        </div>
        <InfoBox variant="info" title="Report Statuses">
          <div className="space-y-1 text-xs">
            <p><strong>Draft</strong> — being created, not yet saved</p>
            <p><strong>Saved</strong> — completed by reviewer, not yet sent</p>
            <p><strong>Sent</strong> — emailed to staff, awaiting their review</p>
            <p><strong>Staff Reviewed</strong> — staff has acknowledged and submitted</p>
            <p><strong>Signed Off</strong> — reviewer has confirmed the process is complete</p>
          </div>
        </InfoBox>
      </Section>

      {/* AI Controls */}
      <Section icon={BrainCircuit} title="AI Controls — Configuring AI Behaviour (Admin Only)" color="bg-rose-500">
        <p className="text-sm text-muted-foreground">
          Admins can configure how the AI makes decisions — without needing any technical knowledge. These settings are found in <strong>Admin Settings → AI Controls</strong>.
        </p>

        <div className="space-y-4 mt-2">
          {/* Alert Triggers */}
          <div>
            <p className="font-semibold text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Alert Triggers</p>
            <p className="text-sm text-muted-foreground mt-1">
              Alert Triggers are specific words or phrases that, when detected in a transcript, cause the AI to flag the recording with a ⚠ warning. This is used to surface recordings that need immediate human attention.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside mt-1 space-y-1">
              <li>Each trigger has a <strong>Severity</strong>: Low, Medium, or High</li>
              <li>Each trigger has a <strong>Category</strong>: Profanity, Safety, Aggression, or Keyword</li>
              <li>Triggers can be individually <strong>enabled or disabled</strong> without deleting them</li>
              <li>Use the <strong>+ Add Trigger</strong> button to add new words or phrases</li>
            </ul>
            <InfoBox variant="warning" title="Example Use Cases">
              Add specific safety-critical phrases that should never appear (e.g. "I don't know which line"), profanity, or aggressive language patterns. The AI will automatically flag any recording containing these.
            </InfoBox>
          </div>

          {/* Quick Grade Guideline */}
          <div>
            <p className="font-semibold text-sm flex items-center gap-2"><Radio className="w-4 h-4 text-orange-500" /> Quick Grade Guideline</p>
            <p className="text-sm text-muted-foreground mt-1">
              When processing recordings in bulk (Monitoring on Mass), the AI assigns a quick overall grade to each recording. This guideline tells the AI <em>how</em> to make that decision.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside mt-1 space-y-1">
              <li>Edit the text area to adjust the AI's grading logic</li>
              <li>Changes take effect immediately for all new recordings processed</li>
              <li>If you leave it blank, the AI will use its built-in defaults</li>
            </ul>
            <InfoBox variant="tip">
              Keep this guideline clear and specific. For example: "Prioritise safety protocol adherence. Any recording where the staff member fails to identify themselves should be graded C or lower."
            </InfoBox>
          </div>

          {/* Assessment Rules */}
          <div>
            <p className="font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Assessment Rules (Full Report Scoring)</p>
            <p className="text-sm text-muted-foreground mt-1">
              Assessment Rules define exactly what the AI looks for when scoring each of the 10 communication aspects in a full report. You can customise the criteria for each grade level (A–D) on a per-aspect basis.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside mt-1 space-y-1">
              <li>10 aspects are pre-configured with default criteria aligned to Rule Book G1</li>
              <li>Click <strong>Edit</strong> on any aspect to update the grading criteria</li>
              <li>Add <strong>Additional Guidance</strong> to give the AI extra context or watch-points</li>
              <li>Changes apply to all reports generated after the update</li>
            </ul>
            <InfoBox variant="warning" title="Important">
              Changing assessment rules will affect future reports but will not retroactively alter already-generated reports. If you need consistency across a period, note the date of any rule changes.
            </InfoBox>
          </div>

          {/* Industry Definitions */}
          <div>
            <p className="font-semibold text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-teal-500" /> Industry Definitions</p>
            <p className="text-sm text-muted-foreground mt-1">
              Industry Definitions teach the AI the meaning of railway-specific abbreviations and terms (e.g. COSS, PICOP, IWA). This ensures the AI interprets specialist language correctly when reading transcripts.
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside mt-1 space-y-1">
              <li>Add new terms using the <strong>+ Add Definition</strong> button</li>
              <li>Edit or delete existing entries using the inline controls</li>
              <li>Definitions are used by the AI across all assessments automatically</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Admin Settings */}
      <Section icon={Settings2} title="Admin Settings — Dropdown Options" color="bg-slate-500">
        <p className="text-sm text-muted-foreground">Admins can manage the dropdown lists used throughout the app to ensure they reflect your organisation's structure.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          <div className="text-sm space-y-1">
            <p className="font-medium">Configurable Options</p>
            <ul className="text-muted-foreground list-disc list-inside space-y-1">
              <li><strong>Role Options</strong> — roles assigned to staff members</li>
              <li><strong>Department Options</strong> — departments for staff profiles</li>
              <li><strong>Line Manager Options</strong> — line manager names</li>
              <li><strong>Call Type Options</strong> — categories for report calls</li>
              <li><strong>Action Templates</strong> — predefined remedial actions</li>
            </ul>
          </div>
          <InfoBox variant="tip" title="Action Templates">
            Action Templates appear as quick-select options when assigning remedial actions to C and D-graded assessment items in reports. Add commonly-used actions here to speed up the reviewer workflow.
          </InfoBox>
        </div>
      </Section>

      {/* Tips */}
      <Section icon={Shield} title="Best Practices & Tips" color="bg-indigo-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoBox variant="tip" title="Audio Quality">
            Higher quality recordings produce more accurate transcriptions. Ensure recordings are clear with minimal background noise for best AI performance.
          </InfoBox>
          <InfoBox variant="tip" title="Transcript Review">
            Always review the AI-generated transcript before running an assessment, especially for calls with background noise or regional accents.
          </InfoBox>
          <InfoBox variant="info" title="AI is a Tool, Not a Judge">
            The AI assessment is a starting point for reviewers — not a final verdict. Always apply professional judgement when reviewing grades and reasoning.
          </InfoBox>
          <InfoBox variant="warning" title="Expiring Recordings">
            Recordings are deleted after 90 days. Generate a full report or download important recordings before they expire.
          </InfoBox>
        </div>
      </Section>

      <p className="text-xs text-muted-foreground text-center pb-4">CritCom301 — User Guide · Last updated May 2026</p>
    </div>
  );
}