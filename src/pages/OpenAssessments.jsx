import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ClipboardList, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STAGES = [
  {
    key: "all",
    label: "All Open",
    description: "All reports not yet signed off",
  },
  {
    key: "draft",
    label: "Awaiting Assessor Review",
    description: "Assessment run but not yet confirmed by assessor",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    key: "saved",
    label: "Awaiting Send to Staff",
    description: "Actions confirmed, ready to send to staff member",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    key: "sent",
    label: "Awaiting Staff Action",
    description: "Sent to staff member, awaiting their response",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    key: "staff_reviewed",
    label: "Awaiting Assessor Sign-off",
    description: "Staff has responded, awaiting assessor to sign off",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
];

const STAGE_MAP = {
  draft: { label: "Awaiting Assessor Review", color: "bg-blue-100 text-blue-700 border-blue-200" },
  saved: { label: "Awaiting Send to Staff", color: "bg-amber-100 text-amber-700 border-amber-200" },
  sent: { label: "Awaiting Staff Action", color: "bg-orange-100 text-orange-700 border-orange-200" },
  staff_reviewed: { label: "Awaiting Assessor Sign-off", color: "bg-purple-100 text-purple-700 border-purple-200" },
};

export default function OpenAssessments() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    base44.entities.Report.list("-created_date", 200).then((all) => {
      // Exclude signed_off reports
      setReports(all.filter((r) => r.status !== "signed_off"));
      setLoading(false);
    });
  }, []);

  const filtered =
    activeFilter === "all"
      ? reports
      : reports.filter((r) => r.status === activeFilter);

  const countFor = (key) =>
    key === "all"
      ? reports.length
      : reports.filter((r) => r.status === key).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Open Assessments</h1>
        <p className="text-muted-foreground mt-1">
          Track reports by what action is needed next.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {STAGES.map((stage) => {
          const count = countFor(stage.key);
          const isActive = activeFilter === stage.key;
          return (
            <button
              key={stage.key}
              onClick={() => setActiveFilter(stage.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow"
                  : "bg-card border-border text-foreground hover:bg-muted"
              }`}
            >
              <span>{stage.label}</span>
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Report List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <ClipboardList className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">No reports in this stage.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => {
            const stage = STAGE_MAP[report.status];
            return (
              <Link
                key={report.id}
                to={`/reports/${report.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">
                      {report.staff_name || "Unknown Staff"}
                    </span>
                    {report.call_date && (
                      <span className="text-xs text-muted-foreground">
                        ·{" "}
                        {new Date(report.call_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {stage && (
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border ${stage.color}`}
                      >
                        {stage.label}
                      </span>
                    )}
                    {report.call_type && (
                      <span className="text-xs text-muted-foreground">
                        {report.call_type}
                      </span>
                    )}
                    {report.role && (
                      <span className="text-xs text-muted-foreground">
                        · {report.role}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}