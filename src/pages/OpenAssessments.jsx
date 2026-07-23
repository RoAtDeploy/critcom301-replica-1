import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ClipboardList, ArrowRight, Layers, AlertTriangle, FileSearch, Send, Clock, MessageSquare, X, Check, ChevronsUpDown } from "lucide-react";
import ActionDeadlineBadge from "@/components/report/ActionDeadlineBadge";
import { getReportActionStatus } from "@/lib/actionDeadlines";
import { useAdmin } from "@/context/AdminContext";
import SearchableStaffSelect from "@/components/monitoring/SearchableStaffSelect";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "all", label: "All Open", icon: Layers, tint: "text-slate-600" },
  { key: "overdue", label: "Overdue Actions", icon: AlertTriangle, tint: "text-red-600", ring: "ring-red-200", chip: "bg-red-100 text-red-700" },
  { key: "draft", label: "Awaiting Review", icon: FileSearch, tint: "text-blue-600", ring: "ring-blue-200", chip: "bg-blue-100 text-blue-700" },
  { key: "saved", label: "Awaiting Send", icon: Send, tint: "text-amber-600", ring: "ring-amber-200", chip: "bg-amber-100 text-amber-700" },
  { key: "sent", label: "Awaiting Staff", icon: Clock, tint: "text-orange-600", ring: "ring-orange-200", chip: "bg-orange-100 text-orange-700" },
  { key: "staff_reviewed", label: "Awaiting Sign-off", icon: MessageSquare, tint: "text-purple-600", ring: "ring-purple-200", chip: "bg-purple-100 text-purple-700" },
];

const STAGE_MAP = {
  draft: { label: "Awaiting Review", color: "bg-blue-100 text-blue-700 border-blue-200" },
  saved: { label: "Awaiting Send", color: "bg-amber-100 text-amber-700 border-amber-200" },
  sent: { label: "Awaiting Staff", color: "bg-orange-100 text-orange-700 border-orange-200" },
  staff_reviewed: { label: "Awaiting Sign-off", color: "bg-purple-100 text-purple-700 border-purple-200" },
};

export default function OpenAssessments() {
  const { staffList } = useAdmin();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [assessorId, setAssessorId] = useState(null);
  const [staffId, setStaffId] = useState(null);
  const [assessorMap, setAssessorMap] = useState({});

  useEffect(() => {
    base44.entities.Report.list("-created_date", 500).then((all) => {
      setReports(all.filter((r) => r.status !== "signed_off"));
      setLoading(false);
    });
    // Assessor names — admins can list users; gracefully degrade for others
    base44.entities.User.list().then((users) => {
      const map = {};
      users.forEach((u) => { map[u.id] = u.full_name || u.email || "Assessor"; });
      setAssessorMap(map);
    }).catch(() => {});
  }, []);

  // Build assessor options from the reports actually present (so it works for any role)
  const assessorOptions = useMemo(() => {
    const seen = {};
    reports.forEach((r) => {
      if (r.created_by_id && !seen[r.created_by_id]) seen[r.created_by_id] = assessorMap[r.created_by_id] || "Unknown assessor";
    });
    return Object.entries(seen).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [reports, assessorMap]);

  const isOverdue = (r) => {
    const s = getReportActionStatus(r);
    return s === "overdue_immediate" || s === "overdue_7day";
  };

  // Apply assessor + staff filters first, so stage counts reflect the selection
  const scoped = useMemo(() => {
    return reports.filter((r) => {
      if (assessorId && r.created_by_id !== assessorId) return false;
      if (staffId && r.staff_id !== staffId) return false;
      return true;
    });
  }, [reports, assessorId, staffId]);

  const filtered =
    activeFilter === "all"
      ? scoped
      : activeFilter === "overdue"
      ? scoped.filter(isOverdue)
      : scoped.filter((r) => r.status === activeFilter);

  const countFor = (key) =>
    key === "all"
      ? scoped.length
      : key === "overdue"
      ? scoped.filter(isOverdue).length
      : scoped.filter((r) => r.status === key).length;

  const hasSelectors = assessorId || staffId;

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

      {/* Assessor & Staff selectors */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assessor</span>
          <SearchableAssessorSelect
            options={assessorOptions}
            value={assessorId}
            onChange={setAssessorId}
          />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Staff Member</span>
          <SearchableStaffSelect
            staffMembers={staffList}
            value={staffId}
            onChange={setStaffId}
            placeholder="All staff"
            includeUnknown={false}
            className="h-9 text-sm w-56"
          />
        </div>
        {hasSelectors && (
          <button
            onClick={() => { setAssessorId(null); setStaffId(null); }}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Stage filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((stage) => {
          const count = countFor(stage.key);
          const isActive = activeFilter === stage.key;
          const Icon = stage.icon;
          return (
            <button
              key={stage.key}
              onClick={() => setActiveFilter(stage.key)}
              className={cn(
                "relative flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all",
                isActive
                  ? cn("border-transparent ring-2 bg-card shadow-sm", stage.ring || "ring-primary/30")
                  : "border-border bg-card/60 hover:bg-card hover:border-primary/20"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isActive ? stage.chip || "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className={cn("text-lg font-bold tabular-nums", isActive ? stage.tint : "text-foreground")}>
                  {count}
                </span>
              </div>
              <span className={cn("text-xs font-medium leading-tight", isActive ? stage.tint : "text-foreground")}>
                {stage.label}
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
            const assessorName = report.created_by_id ? assessorMap[report.created_by_id] : null;
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
                    {assessorName && (
                      <span className="text-xs text-muted-foreground">
                        · {assessorName}
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
                    <ActionDeadlineBadge report={report} />
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

function SearchableAssessorSelect({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const selected = options.find((o) => o.id === value);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className="inline-flex items-center justify-between gap-1 rounded-md border border-input bg-transparent h-9 px-3 text-sm w-56 hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.name : "All assessors"}
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search assessor…" value={query} onValueChange={setQuery} className="h-9" />
          <CommandList>
            <CommandEmpty>No assessor found.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => { onChange(null); setOpen(false); }}>
                <Check className={cn("w-4 h-4", !value && "opacity-100", value && "opacity-0")} />
                All assessors
              </CommandItem>
              {filtered.map((o) => (
                <CommandItem key={o.id} onSelect={() => { onChange(o.id); setOpen(false); }}>
                  <Check className={cn("w-4 h-4", value === o.id ? "opacity-100" : "opacity-0")} />
                  {o.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}