/**
 * Action deadline logic:
 * - Grade D = Immediate (overdue if sent and not completed)
 * - Grade C = 7 days from sent_at (overdue if past deadline and not completed)
 */

export function getReportActionStatus(report) {
  if (!report.action_items?.length) return null;
  if (!["sent", "staff_reviewed", "signed_off"].includes(report.status)) return null;

  const sentAt = report.sent_at ? new Date(report.sent_at) : null;
  const now = new Date();

  let hasImmediateOverdue = false;
  let hasCDeadlineOverdue = false;
  let hasImmediatePending = false;
  let hasCPending = false;

  for (const item of report.action_items) {
    const grade = item.aspect_grade;
    const completed = item.completed;

    if (grade === "D") {
      if (!completed) {
        // D grade: overdue immediately after being sent
        if (sentAt) hasImmediateOverdue = true;
        else hasImmediatePending = true;
      }
    } else if (grade === "C") {
      if (!completed) {
        if (sentAt) {
          const deadline = new Date(sentAt.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (now > deadline) hasCDeadlineOverdue = true;
          else hasCPending = true;
        } else {
          hasCPending = true;
        }
      }
    }
  }

  if (hasImmediateOverdue) return "overdue_immediate";
  if (hasCDeadlineOverdue) return "overdue_7day";
  if (hasImmediatePending) return "pending_immediate";
  if (hasCPending) return "pending_7day";
  return null;
}

export function getDeadlineLabel(report) {
  if (!report.sent_at) return null;
  const deadline = new Date(new Date(report.sent_at).getTime() + 7 * 24 * 60 * 60 * 1000);
  return deadline.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function getDaysUntilDeadline(report) {
  if (!report.sent_at) return null;
  const deadline = new Date(new Date(report.sent_at).getTime() + 7 * 24 * 60 * 60 * 1000);
  const diff = deadline - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}