import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Filter, Phone, Clock, ChevronRight, Upload, Download, ShieldCheck, AlertTriangle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAdmin } from "@/context/AdminContext";
import CsvUploadDialog from "@/components/staff/CsvUploadDialog";

const getInitials = (name) => name.split(" ").map((n) => n[0]).join("");

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
};


export default function StaffMembers() {
  const { staffList, refreshStaff, roles: availableRoles } = useAdmin();
  const [search, setSearch] = useState("");
  const [screenedCounts, setScreenedCounts] = useState({});
  const [callSeconds, setCallSeconds] = useState({});
  const [complianceCounts, setComplianceCounts] = useState({});
  const [csvOpen, setCsvOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterRoles, setFilterRoles] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "active" | "review"
  const [filterOutstanding, setFilterOutstanding] = useState(false);

  useEffect(() => { refreshStaff(); }, []);

  useEffect(() => {
    if (staffList.length === 0) return;
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    Promise.all([
      base44.entities.Report.list('-created_date', 2000),
      base44.entities.Recording.list('-created_date', 2000),
    ]).then(([reports, recordings]) => {
      const screened = {};
      const seconds = {};
      const compliance = {};

      reports.forEach((r) => {
        if (!r.staff_id) return;
        screened[r.staff_id] = (screened[r.staff_id] || 0) + 1;
        seconds[r.staff_id] = (seconds[r.staff_id] || 0) + (r.transcription_duration || 0);
        if (r.status === "signed_off") {
          const d = new Date(r.signed_off_at || r.updated_date || r.created_date);
          if (d >= twelveMonthsAgo) {
            compliance[r.staff_id] = (compliance[r.staff_id] || 0) + 1;
          }
        }
      });

      recordings.forEach((r) => {
        if (!r.staff_id) return;
        screened[r.staff_id] = (screened[r.staff_id] || 0) + 1;
        seconds[r.staff_id] = (seconds[r.staff_id] || 0) + (r.duration || 0);
      });

      setScreenedCounts(screened);
      setCallSeconds(seconds);
      setComplianceCounts(compliance);
    });
  }, [staffList]);

  const filtered = staffList.filter((s) => {
    if (!s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (filterRoles.length > 0 && !filterRoles.some((r) => (s.roles || []).includes(r))) return false;
    if (filterOutstanding && (complianceCounts[s.id] || 0) >= 3) return false;
    return true;
  });

  const activeFilterCount = filterRoles.length + (filterStatus !== "all" ? 1 : 0) + (filterOutstanding ? 1 : 0);

  const clearFilters = () => {
    setFilterRoles([]);
    setFilterStatus("all");
    setFilterOutstanding(false);
  };

  const toggleRole = (role) => {
    setFilterRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Members</h1>
          <p className="text-muted-foreground mt-1">View and manage your team's performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {
            const csv = ["name,email,sentinelId,roles,department,lineManager,phone", "Jane Smith,jane.smith@example.com,SEN-001,Signaller;Controller,Operations,John Doe,07700900123"].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "staff_template.csv"; a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="w-4 h-4 mr-2" />
            CSV Template
          </Button>
          <Button variant="outline" onClick={() => setCsvOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <Link to="/staff/new">
            <Button className="bg-primary hover:bg-primary/90">
              + Add Staff Member
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search staff members…"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearFilters}>
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Status</p>
              <div className="flex gap-2 flex-wrap">
                {[["all", "All"], ["active", "Active"], ["inactive", "Inactive"]].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilterStatus(val)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      filterStatus === val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Roles */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Role</p>
              <div className="flex gap-2 flex-wrap">
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      filterRoles.includes(role)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Compliance */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Compliance</p>
              <button
                onClick={() => setFilterOutstanding((v) => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  filterOutstanding
                    ? "bg-destructive/10 text-destructive border-destructive/30"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Outstanding assessments only (&lt;3/3)
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        {filtered.map((member) => {
          const isInactive = member.status === "inactive";
          return (
          <Link key={member.id} to={`/staff/${member.id}`}>
            <Card className={`border-border/50 hover:shadow-md transition-shadow duration-200 cursor-pointer ${isInactive ? "opacity-50" : ""}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className={isInactive ? "bg-muted text-muted-foreground font-semibold text-sm" : "bg-primary/10 text-primary font-semibold text-sm"}>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className={`font-semibold text-sm ${isInactive ? "text-muted-foreground" : ""}`}>{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.roles.join(", ")}</p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-6">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{screenedCounts[member.id] || 0}</span>
                      <span className="text-muted-foreground">screened</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{formatDuration(callSeconds[member.id] || 0)}</span>
                      <span className="text-muted-foreground">call time</span>
                    </div>

                    {(() => {
                      const count = complianceCounts[member.id] || 0;
                      const met = count >= 3;
                      return (
                        <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${met ? "bg-accent/10 text-accent border-accent/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                          {met ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          <span className="font-semibold">{count}/3</span>
                          <span className="text-[11px] opacity-75">assessments</span>
                        </div>
                      );
                    })()}
                    <Badge
                      variant="secondary"
                      className={
                        member.status === "active" ? "bg-accent/10 text-accent border-accent/20" :
                        member.status === "inactive" ? "bg-muted text-muted-foreground border-border" :
                        "bg-chart-3/10 text-chart-3 border-chart-3/20"
                      }
                    >
                      {member.status === "active" ? "Active" : member.status === "inactive" ? "Inactive" : "Review"}
                    </Badge>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
          );
        })}
      </div>
      <CsvUploadDialog open={csvOpen} onClose={() => setCsvOpen(false)} onImported={refreshStaff} />
    </motion.div>
  );
}