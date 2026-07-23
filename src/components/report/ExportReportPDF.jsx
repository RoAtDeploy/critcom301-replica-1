import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";

const GRADE_COLORS = {
  A: [209, 250, 229],
  B: [254, 249, 195],
  C: [255, 237, 213],
  D: [254, 226, 226],
};

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 5) {
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function sectionHeader(doc, text, y, pageW) {
  doc.setFillColor(50, 50, 120);
  doc.rect(14, y - 4, pageW - 28, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(text.toUpperCase(), 16, y + 0.5);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  return y + 8;
}

function checkPageBreak(doc, y, needed = 20) {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 15) {
    doc.addPage();
    return 20;
  }
  return y;
}

export default function ExportReportPDF({ report }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentW = pageW - margin * 2;
      let y = 20;

      // ── Title ──────────────────────────────────────────────────────────
      doc.setFillColor(238, 242, 255);
      doc.rect(0, 0, pageW, 28, "F");
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 80);
      doc.text("Spoken Safety Critical Communications Monitoring Form", pageW / 2, 12, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 120);
      doc.text(`${report.staff_name || "Unknown"} · ${report.call_date ? new Date(report.call_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "No date"}`, pageW / 2, 20, { align: "center" });
      doc.setTextColor(30, 30, 30);
      y = 36;

      // ── Call Details ──────────────────────────────────────────────────
      y = sectionHeader(doc, "Call Details", y, pageW);
      const details = [
        ["Staff Member", report.staff_name || "—"],
        ["Role on Site", report.role || "—"],
        ["Date of Call", report.call_date ? new Date(report.call_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"],
        ["Call Type", report.call_type || "—"],
        ["Duration", report.transcription_duration ? `${Math.round(report.transcription_duration)}s` : "—"],
        ["Language", report.transcription_language || "—"],
        ["Conversation With", report.other_role || "—"],
      ];
      if (report.call_context) details.push(["Context", report.call_context]);

      details.forEach(([label, val]) => {
        y = checkPageBreak(doc, y, 8);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(label + ":", margin, y);
        doc.setFont("helvetica", "normal");
        y = addWrappedText(doc, val, margin + 38, y, contentW - 38, 5);
        y += 1;
      });
      y += 4;

      // ── AI Call Summary ───────────────────────────────────────────────
      if (report.call_summary) {
        y = checkPageBreak(doc, y, 16);
        y = sectionHeader(doc, "AI Call Summary", y, pageW);
        doc.setFontSize(8);
        y = addWrappedText(doc, report.call_summary, margin, y, contentW, 5);
        y += 6;
      }

      // ── Transcription ─────────────────────────────────────────────────
      if (report.timestamped_transcript?.length > 0 || report.transcription_text) {
        y = checkPageBreak(doc, y, 16);
        y = sectionHeader(doc, "Transcription", y, pageW);
        doc.setFontSize(7.5);
        if (report.timestamped_transcript?.length > 0) {
          const staffInitials = report.staff_name
            ? report.staff_name.split(" ").map((n) => n[0]).join("").toUpperCase()
            : "ST";
          for (const line of report.timestamped_transcript) {
            y = checkPageBreak(doc, y, 8);
            const isStaff = report.staff_channel
              ? (line.speaker === report.staff_channel || line.channel === report.staff_channel)
              : line.is_staff;
            const speaker = isStaff ? staffInitials : (report.other_role?.toUpperCase() || "?");
            doc.setFont("helvetica", "bold");
            doc.text(`[${line.timestamp || ""}] ${speaker}:`, margin, y);
            doc.setFont("helvetica", "normal");
            y = addWrappedText(doc, line.text, margin + 28, y, contentW - 28, 4.5);
            y += 1;
          }
        } else {
          y = addWrappedText(doc, report.transcription_text, margin, y, contentW, 4.5);
        }
        y += 6;
      }

      // ── Quality Assessment ────────────────────────────────────────────
      const qa = report.quality_assessment;
      const raw = qa?.response ?? qa;
      const aspects = raw?.aspects || raw?.rules || [];
      if (aspects.length > 0) {
        y = checkPageBreak(doc, y, 16);
        y = sectionHeader(doc, "Communication Quality Assessment", y, pageW);
        for (const aspect of aspects) {
          y = checkPageBreak(doc, y, 24);
          const override = aspect.override || null;
          const grade = override?.grade || aspect.grade;
          const gradeColor = GRADE_COLORS[grade] || [240, 240, 240];

          // Aspect row background
          doc.setFillColor(...gradeColor);
          doc.roundedRect(margin, y - 3, contentW, 8, 1, 1, "F");
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text(`${aspect.aspect_name || aspect.name || "Aspect"}`, margin + 2, y + 1.5);
          doc.setFillColor(gradeColor[0] - 30, gradeColor[1] - 30, gradeColor[2] - 30);
          doc.roundedRect(pageW - margin - 12, y - 2, 12, 6, 1, 1, "F");
          doc.setTextColor(30, 30, 30);
          doc.text(grade || "—", pageW - margin - 6, y + 1.5, { align: "center" });
          y += 9;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          if (aspect.reasoning) {
            y = addWrappedText(doc, aspect.reasoning, margin + 2, y, contentW - 4, 4.5);
            y += 1;
          }
          if (override?.justification) {
            doc.setFont("helvetica", "italic");
            y = addWrappedText(doc, `Override: ${override.justification}`, margin + 2, y, contentW - 4, 4.5);
            doc.setFont("helvetica", "normal");
            y += 1;
          }
          y += 3;
        }
        y += 3;
      }

      // ── Action Items ──────────────────────────────────────────────────
      if (report.action_items?.length > 0 || report.general_feedback) {
        y = checkPageBreak(doc, y, 16);
        y = sectionHeader(doc, "Actions & Feedback", y, pageW);
        if (report.general_feedback) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text("General Call Feedback:", margin, y);
          y += 4;
          doc.setFont("helvetica", "normal");
          y = addWrappedText(doc, report.general_feedback, margin, y, contentW, 4.5);
          y += 4;
        }
        for (const item of (report.action_items || [])) {
          y = checkPageBreak(doc, y, 20);
          const gradeColor = GRADE_COLORS[item.aspect_grade] || [240, 240, 240];
          doc.setFillColor(...gradeColor);
          doc.roundedRect(margin, y - 3, contentW, 8, 1, 1, "F");
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text(`${item.aspect_name}`, margin + 2, y + 1.5);
          doc.setFillColor(gradeColor[0] - 30, gradeColor[1] - 30, gradeColor[2] - 30);
          doc.roundedRect(pageW - margin - 12, y - 2, 12, 6, 1, 1, "F");
          doc.text(item.aspect_grade || "—", pageW - margin - 6, y + 1.5, { align: "center" });
          y += 9;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          if (item.ai_reasoning && item.include_ai_feedback !== false) {
            y = addWrappedText(doc, `AI Feedback: ${item.ai_reasoning}`, margin + 2, y, contentW - 4, 4.5);
            y += 1;
          }
          if (item.reviewer_comment) {
            y = addWrappedText(doc, `Reviewer comment: ${item.reviewer_comment}`, margin + 2, y, contentW - 4, 4.5);
            y += 1;
          }
          if (item.action) {
            doc.setFont("helvetica", "bold");
            y = addWrappedText(doc, `Required action: ${item.action}`, margin + 2, y, contentW - 4, 4.5);
            doc.setFont("helvetica", "normal");
            y += 1;
          }
          if (item.aspect_grade === "C" || item.aspect_grade === "D") {
            const confirmed = item.completed ? "✓ Confirmed by staff" : "✗ Not confirmed";
            doc.text(confirmed, margin + 2, y);
            y += 5;
            if (item.staff_comment) {
              doc.setFont("helvetica", "italic");
              y = addWrappedText(doc, `Staff comment: "${item.staff_comment}"`, margin + 2, y, contentW - 4, 4.5);
              doc.setFont("helvetica", "normal");
              y += 1;
            }
          }
          y += 3;
        }
        y += 3;
      }

      // ── Staff Acknowledgement ─────────────────────────────────────────
      y = checkPageBreak(doc, y, 20);
      y = sectionHeader(doc, "Staff Acknowledgement", y, pageW);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      if (report.staff_reviewed_at) {
        doc.text(`Reviewed by ${report.staff_name} on ${new Date(report.staff_reviewed_at).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, margin, y);
        y += 6;
      }

      // Signature image
      if (report.staff_signature) {
        y = checkPageBreak(doc, y, 32);
        doc.text("Staff signature:", margin, y);
        y += 3;
        try {
          doc.addImage(report.staff_signature, "PNG", margin, y, 60, 20);
          y += 24;
        } catch (_) {
          y += 2;
        }
      }
      y += 4;

      // ── Sign-Off ──────────────────────────────────────────────────────
      y = checkPageBreak(doc, y, 28);
      y = sectionHeader(doc, "Assessor Sign-Off", y, pageW);
      doc.setFillColor(220, 252, 231);
      doc.roundedRect(margin, y - 2, contentW, 22, 2, 2, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(21, 128, 61);
      doc.text("Report Finalised", margin + 4, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text(`Signed off by: ${report.signed_off_by || "Assessor"}`, margin + 4, y + 12);
      if (report.signed_off_at) {
        const signOffDate = new Date(report.signed_off_at).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
        doc.text(`Date & time: ${signOffDate}`, margin + 4, y + 18);
      }
      y += 26;

      // ── Footer on every page ──────────────────────────────────────────
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text("CritCom301 — Safety-Critical Communications Monitoring", margin, pageH - 8);
        doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 8, { align: "right" });
      }

      const fileName = `report-${report.staff_name?.replace(/\s+/g, "-").toLowerCase() || "unknown"}-${report.call_date || "nodate"}.pdf`;
      doc.save(fileName);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-2" size="sm">
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {exporting ? "Generating PDF…" : "Export to PDF"}
    </Button>
  );
}