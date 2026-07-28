import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import { base44 } from "@/api/base44Client";

// CritCom301 brand palette (mirrors the web app + email aesthetic)
const BRAND = {
  navy: [30, 34, 53],          // #1e2235 — header band
  navyMuted: [139, 157, 195],  // #8b9dc3 — eyebrow text
  primary: [79, 95, 219],      // #4f5fdb — indigo primary
  primaryTint: [238, 242, 255],// light indigo
  accent: [22, 163, 140],      // teal accent (signed-off)
  accentTint: [224, 248, 240],
  textDark: [30, 41, 59],      // #1e293b
  textMuted: [100, 116, 139],  // #64748b
  cardBg: [248, 249, 252],     // #f8f9fc
  border: [232, 236, 244],     // #e8ecf4
  pageBg: [244, 245, 247],     // #f4f5f7
};

const GRADE_BG = { A: [220, 252, 231], B: [254, 249, 195], C: [255, 237, 213], D: [254, 226, 226] };
const GRADE_FG = { A: [22, 101, 52], B: [133, 77, 14], C: [154, 52, 18], D: [153, 27, 27] };

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 5) {
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function sectionHeader(doc, text, y, pageW) {
  doc.setFillColor(...BRAND.primary);
  doc.roundedRect(14, y - 4, pageW - 28, 7.5, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text(text.toUpperCase(), 16, y + 0.8);
  doc.setTextColor(...BRAND.textDark);
  doc.setFont("helvetica", "normal");
  return y + 8.5;
}

function gradeBadge(doc, grade, x, y, w = 12, h = 6.5) {
  const bg = GRADE_BG[grade] || [240, 240, 240];
  const fg = GRADE_FG[grade] || [71, 85, 105];
  doc.setFillColor(...bg);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, "F");
  doc.setTextColor(...fg);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(grade || "—", x + w / 2, y + h / 2 + 1.2, { align: "center" });
  doc.setTextColor(...BRAND.textDark);
  doc.setFont("helvetica", "normal");
}

const ORANGE = [245, 130, 32]; // #f58220 — CritCom301 accent

// Draws the CritCom301 logo: white rounded square + orange headphone icon, with
// "CritCom" (white) + "301" (orange) wordmark to the right. (x, y) is the top-left
// of the icon square; the wordmark follows at a fixed gap.
function drawCritComLogo(doc, x, y, size = 14) {
  const navy = BRAND.navy;
  // Icon tile
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, size, size, 2.2, 2.2, "F");

  // Headband arc — a stroked orange ellipse with the lower half masked away by
  // the white tile, so only a clean rounded arch remains.
  const cx = x + size / 2;
  const rx = size * 0.30;
  const ry = size * 0.27;
  const cy = y + size * 0.47;
  const lw = size * 0.13;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(lw);
  doc.ellipse(cx, cy, rx, ry, "S");
  doc.setLineWidth(0.2);
  doc.setFillColor(255, 255, 255);
  doc.rect(x + 0.4, cy, size - 0.8, (y + size) - cy - 0.4, "F");

  // Ear cups (orange) hanging down from the arch endpoints
  const cupW = size * 0.18;
  const cupH = size * 0.30;
  const cupTop = cy - cupW * 0.05;
  const leftX = cx - rx - cupW / 2;
  const rightX = cx + rx - cupW / 2;
  doc.setFillColor(...ORANGE);
  doc.roundedRect(leftX, cupTop, cupW, cupH, 1.0, 1.0, "F");
  doc.roundedRect(rightX, cupTop, cupW, cupH, 1.0, 1.0, "F");

  // Wordmark: "CritCom" white + "301" orange, baseline aligned with the icon
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size * 0.62);
  const textX = x + size + 3;
  const baseY = y + size * 0.72;
  doc.setTextColor(255, 255, 255);
  doc.text("CritCom", textX, baseY);
  const critW = doc.getTextWidth("CritCom");
  doc.setTextColor(...ORANGE);
  doc.text("301", textX + critW, baseY);
  doc.setTextColor(...BRAND.textDark);
  doc.setFont("helvetica", "normal");
}

// Loads the organisation logo (uploaded via Admin → General) as a data URL with
// its natural dimensions, so it can be embedded on the navy header band.
async function loadOrgLogo() {
  try {
    const records = await base44.entities.AdminConfig.filter({ key: "logo" });
    const url = records?.[0]?.values?.[0];
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    const dims = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight, type: blob.type || "PNG" });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
    if (!dims) return null;
    return { dataUrl, ...dims };
  } catch {
    return null;
  }
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

      // ── Organisation logo (preloaded before drawing the band) ─────────
      const orgLogo = await loadOrgLogo();

      // ── Branded header band ───────────────────────────────────────────
      const bandH = 30;
      doc.setFillColor(...BRAND.navy);
      doc.rect(0, 0, pageW, bandH, "F");

      // CritCom301 logo — left aligned, vertically centred in the band
      const logoSize = 18;
      drawCritComLogo(doc, margin, (bandH - logoSize) / 2, logoSize);

      // Organisation logo — placed on the right inside a white rounded chip
      if (orgLogo) {
        const maxW = 44;
        const maxH = 18;
        const scale = Math.min(maxW / orgLogo.w, maxH / orgLogo.h);
        const drawW = orgLogo.w * scale;
        const drawH = orgLogo.h * scale;
        const padChip = 3;
        const chipW = drawW + padChip * 2;
        const chipH = drawH + padChip * 2;
        const chipX = pageW - margin - chipW;
        const chipY = (bandH - chipH) / 2;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(chipX, chipY, chipW, chipH, 1.5, 1.5, "F");
        try {
          doc.addImage(orgLogo.dataUrl, orgLogo.type, chipX + padChip, chipY + padChip, drawW, drawH);
        } catch (_) { /* ignore broken image */ }
      }

      // Subtitle just below the band
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.textDark);
      doc.text("Communication Monitoring Report", margin, bandH + 6);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.textMuted);
      doc.text(
        `${report.staff_name || "Unknown"} · ${report.call_date ? new Date(report.call_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "No date"}`,
        margin, bandH + 11
      );
      doc.setTextColor(...BRAND.textDark);
      y = bandH + 16;

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
          doc.setFillColor(...BRAND.cardBg);
          doc.roundedRect(margin, y - 3, contentW, 8.5, 1.5, 1.5, "F");
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...BRAND.textDark);
          doc.text(`${aspect.aspect_name || aspect.name || "Aspect"}`, margin + 2.5, y + 1.8);
          gradeBadge(doc, grade, pageW - margin - 13, y - 2.2);
          y += 9.5;

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
          doc.setFillColor(...BRAND.cardBg);
          doc.roundedRect(margin, y - 3, contentW, 8.5, 1.5, 1.5, "F");
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...BRAND.textDark);
          doc.text(`${item.aspect_name}`, margin + 2.5, y + 1.8);
          gradeBadge(doc, item.aspect_grade, pageW - margin - 13, y - 2.2);
          y += 9.5;

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
      doc.setFillColor(...BRAND.accentTint);
      doc.roundedRect(margin, y - 2, contentW, 22, 2, 2, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.accent);
      doc.text("Report Finalised", margin + 4, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...BRAND.textDark);
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
        doc.setTextColor(...BRAND.navyMuted);
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