import { AlertTriangle, Clock, Zap } from "lucide-react";
import { getReportActionStatus, getDaysUntilDeadline } from "@/lib/actionDeadlines";

export default function ActionDeadlineBadge({ report, className = "" }) {
  const status = getReportActionStatus(report);
  if (!status) return null;

  if (status === "overdue_immediate") {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 ${className}`}>
        <AlertTriangle className="w-3 h-3" /> Immediate Action Overdue
      </span>
    );
  }

  if (status === "overdue_7day") {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 ${className}`}>
        <AlertTriangle className="w-3 h-3" /> 7-Day Deadline Overdue
      </span>
    );
  }

  if (status === "pending_immediate") {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300 ${className}`}>
        <Zap className="w-3 h-3" /> Immediate Action Required
      </span>
    );
  }

  if (status === "pending_7day") {
    const days = getDaysUntilDeadline(report);
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 ${className}`}>
        <Clock className="w-3 h-3" />
        {days !== null && days > 0 ? `${days}d left` : "Due today"}
      </span>
    );
  }

  return null;
}