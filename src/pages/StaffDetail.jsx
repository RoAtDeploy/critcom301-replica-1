import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import RecordingRow from "@/components/monitoring/RecordingRow";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Pencil, FileText, TrendingUp, Phone, Mail,
  Building2, Users, BadgeCheck, X, Check, Sparkles, Radio, ChevronDown, ChevronUp, Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { useAdmin } from "@/context/AdminContext";
import ActionDeadlineBadge from "@/components/report/ActionDeadlineBadge";

const getInitials = (name) => name.split(" ").map((n) => n[0]).join("");
const scoreToGrade = (score) => {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
};
const gradeColor = (score) => {
  const grade = scoreToGrade(score);
  if (grade === "A") return "text-accent";
  if (grade === "B") return "text-chart-3";
  if (grade === "C") return "text-chart-3";
  return "text-destructive";
};
const gradeBg = (score) => {
  const grade = scoreToGrade(score);
  if (grade === "A") return "bg-accent/10 text-accent border-accent/20";
  if (grade === "B") return "bg-chart-3/10 text-chart-3 border-chart-3/20";
  if (grade === "C") return "bg-chart-3/10 text-chart-3 border-chart-3/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
};

export default function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { roles: adminRoles, departments, lineManagerOptions, staffList, updateStaff } = useAdmin();

  const original = staffList.find((s) => s.id === id);

  const normaliseForm = (s) => {
    if (!s) return {};
    const parts = (s.name || "").trim().split(" ");
    return {
      ...s,
      firstName: s.firstName || parts[0] || "",
      lastName: s.lastName || parts.slice(1).join(" ") || "",
      lineManagers: s.lineManagers || [],
    };
  };

  const [member, setMember] = useState(original);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(normaliseForm(original));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [managersOpen, setManagersOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [reportsOpen, setReportsOpen] = useState(true);
  const [callsOpen, setCallsOpen] = useState(true);

  useEffect(() => {
    base44.entities.Report.filter({ staff_id: id }, "-created_date").then(setReports);
    base44.entities.Recording.filter({ staff_id: id }, "-created_date").then(setRecordings).catch(() => {});
  }, [id]);

  if (!member) return (
    <div className="text-center py-20 text-muted-foreground">Staff member not found.</div>
  );

  const toggleRole = (role) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  };

  const toggleFormLineManager = (m) => {
    setForm((f) => ({
      ...f,
      lineManagers: f.lineManagers?.some((s) => s.email === m.email)
        ? f.lineManagers.filter((s) => s.email !== m.email)
        : [...(f.lineManagers || []), m],
    }));
  };

  const handleSave = async () => {
    const updated = { ...form, name: `${form.firstName} ${form.lastName}` };
    setMember(updated);
    await updateStaff(id, updated);
    setEditing(false);
  };

  const handleCancel = () => {
    setForm(normaliseForm(member));
    setEditing(false);
    setRolesOpen(false);
  };

  const handleDelete = async () => {
    await base44.entities.StaffMember.delete(id);
    navigate("/staff");
  };

  const handleGradeOverride = async (recId, grade, justification) => {
    if (grade === null) {
      await base44.entities.Recording.update(recId, { override: null });
      setRecordings(prev => prev.map(r => r.id === recId ? { ...r, override: null } : r));
    } else {
      const override = { grade, justification };
      await base44.entities.Recording.update(recId, { override });
      setRecordings(prev => prev.map(r => r.id === recId ? { ...r, override } : r));
    }
  };

  const handleGenerateReport = (recording) => {
    const params = new URLSearchParams();
    params.set("staffId", id);
    if (recording.id) params.set("recordingId", recording.id);
    navigate(`/reports/new?${params.toString()}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-4xl mx-auto">

      {/* Back */}
      <Link to="/staff" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Staff
      </Link>

      {/* Header card */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{member.name}</h1>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {member.roles.map((r) => (
                    <Badge key={r} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">{r}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {editing ? (
                <Select value={form.status || "active"} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className={
                  member.status === "active" ? "bg-accent/10 text-accent border-accent/20" :
                  member.status === "inactive" ? "bg-muted text-muted-foreground border-border" :
                  "bg-chart-3/10 text-chart-3 border-chart-3/20"
                }>
                  {member.status === "active" ? "Active" : member.status === "inactive" ? "Inactive" : "Review"}
                </Badge>
              )}
              {!editing && (
                <>
                  <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                    <Pencil className="w-4 h-4 mr-1.5" /> Edit
                  </Button>
                  <Button onClick={() => setConfirmDelete(true)} variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Staff Information</CardTitle>
          {editing && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel}><X className="w-3.5 h-3.5 mr-1" />Cancel</Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleSave}><Check className="w-3.5 h-3.5 mr-1" />Save</Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Sentinel / ID Number <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={form.sentinelId} onChange={(e) => setForm({ ...form, sentinelId: e.target.value })} placeholder="e.g. SNT-00142" />
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                <div className="flex">
                  <div className="flex items-center px-3 border border-r-0 border-input rounded-l-md bg-muted text-sm font-medium text-muted-foreground select-none">🇬🇧 +44</div>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-l-none" placeholder="7700 900 000" />
                </div>
              </div>
              {/* Roles multi-select */}
              <div className="space-y-1.5">
                <Label>Roles</Label>
                {form.roles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1 pr-1">
                        {r}
                        <button type="button" onClick={() => toggleRole(r)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <button type="button" onClick={() => setRolesOpen((o) => !o)} className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-input bg-background text-sm text-left hover:bg-muted/40 transition-colors">
                    <span className="text-muted-foreground">{form.roles.length === 0 ? "Select roles…" : `${form.roles.length} selected`}</span>
                    <svg className={`w-4 h-4 text-muted-foreground transition-transform ${rolesOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {rolesOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                      {adminRoles.map((role) => {
                        const checked = form.roles.includes(role);
                        return (
                          <button key={role} type="button" onClick={() => toggleRole(role)} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-muted transition-colors ${checked ? "bg-primary/5" : ""}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-primary border-primary" : "border-input"}`}>
                              {checked && <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Department <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {/* Line Managers multi-select */}
              <div className="space-y-1.5">
                <Label>Line Manager(s) <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                {form.lineManagers?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.lineManagers.map((m) => (
                      <Badge key={m.email} variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1 pr-1">
                        {m.name}
                        <button type="button" onClick={() => setForm({ ...form, lineManagers: form.lineManagers.filter((s) => s.email !== m.email) })} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <button type="button" onClick={() => setManagersOpen((o) => !o)} className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-input bg-background text-sm text-left hover:bg-muted/40 transition-colors">
                    <span className="text-muted-foreground">{!form.lineManagers?.length ? "Select line manager(s)…" : `${form.lineManagers.length} selected`}</span>
                    <svg className={`w-4 h-4 text-muted-foreground transition-transform ${managersOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {managersOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-popover border border-border rounded-md shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                      {lineManagerOptions.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-muted-foreground">No line managers available.</p>
                      ) : lineManagerOptions.map((m) => {
                        const checked = form.lineManagers?.some((s) => s.email === m.email);
                        return (
                          <button key={m.email} type="button" onClick={() => toggleFormLineManager(m)} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-muted transition-colors ${checked ? "bg-primary/5" : ""}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-primary border-primary" : "border-input"}`}>
                              {checked && <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{m.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <InfoRow icon={BadgeCheck} label="Sentinel / ID" value={member.sentinelId || "—"} />
              <InfoRow icon={Mail} label="Email" value={member.email || "—"} />
              <InfoRow icon={Phone} label="Phone" value={member.phone ? `+44 ${member.phone}` : "—"} />
              <InfoRow icon={Building2} label="Department" value={member.department || "—"} />
              <InfoRow icon={Users} label="Line Manager(s)" value={(member.lineManagers?.length ? member.lineManagers.map((m) => m.name).join(", ") : member.lineManager) || "—"} />
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Avg Grade</p>
                  <p className={`font-semibold mt-0.5 ${gradeColor(member.avgScore)}`}>{scoreToGrade(member.avgScore)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-3 cursor-pointer" onClick={() => setReportsOpen(o => !o)}>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Reports ({reports.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Link to={`/reports/new?staffId=${id}`} onClick={e => e.stopPropagation()}>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate New
              </Button>
            </Link>
            {reportsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        {reportsOpen && (
          <CardContent className="space-y-4">
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No reports yet for this staff member.</p>
            ) : (() => {
              const openReports = reports.filter(r => r.status !== "signed_off");
              const completedReports = reports.filter(r => r.status === "signed_off");

              const STATUS_LABELS = {
                draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
                saved: { label: "Saved", className: "bg-primary/10 text-primary border-primary/20" },
                sent: { label: "Sent", className: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
                staff_reviewed: { label: "Staff Reviewed", className: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
                signed_off: { label: "Signed Off", className: "bg-accent/10 text-accent border-accent/20" },
              };

              const handleDeleteDraft = async (e, reportId) => {
                e.preventDefault();
                e.stopPropagation();
                await base44.entities.Report.delete(reportId);
                setReports(prev => prev.filter(r => r.id !== reportId));
              };

              const ReportRow = ({ report }) => {
                const statusCfg = STATUS_LABELS[report.status] || STATUS_LABELS.draft;
                return (
                  <Link key={report.id} to={`/reports/${report.id}`}>
                    <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{report.call_type || "Call Report"}</p>
                          <p className="text-xs text-muted-foreground">
                            {report.other_role ? `With ${report.other_role}` : report.role || "—"}
                            {report.call_date ? ` · ${new Date(report.call_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                          </p>
                          <ActionDeadlineBadge report={report} className="mt-1" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={statusCfg.className}>
                          {statusCfg.label}
                        </Badge>
                        {report.status === "draft" && (
                          <button
                            onClick={(e) => handleDeleteDraft(e, report.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              };

              return (
                <>
                  {openReports.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Open Assessments ({openReports.length})</p>
                      <div className="space-y-1">
                        {openReports.map(r => <ReportRow key={r.id} report={r} />)}
                      </div>
                    </div>
                  )}
                  {completedReports.length > 0 && (
                    <div>
                      {openReports.length > 0 && <div className="border-t border-border/40 my-2" />}
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Completed ({completedReports.length})</p>
                      <div className="space-y-1">
                        {completedReports.map(r => <ReportRow key={r.id} report={r} />)}
                      </div>
                    </div>
                  )}
                  {openReports.length === 0 && completedReports.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No reports yet.</p>
                  )}
                </>
              );
            })()}
          </CardContent>
        )}
      </Card>
      {/* Calls from Monitoring on Mass */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 flex flex-row items-center justify-between cursor-pointer" onClick={() => setCallsOpen(o => !o)}>
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="w-4 h-4 text-orange-500" />
            Monitoring Calls ({recordings.length})
          </CardTitle>
          {callsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </CardHeader>
        {callsOpen && <CardContent className="space-y-2">
          {recordings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No calls uploaded via Monitoring on Mass for this staff member.</p>
          ) : (
            recordings.map((rec) => (
              <RecordingRow
                key={rec.id}
                recording={{ ...rec, staff_name: null }}
                onGradeOverride={handleGradeOverride}
                onGenerateReport={handleGenerateReport}
              />
            ))
          )}
        </CardContent>}
      </Card>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h2 className="text-base font-semibold">Delete Staff Member?</h2>
            <p className="text-sm text-muted-foreground">
              This will permanently delete <span className="font-medium text-foreground">{member.name}</span> and all associated data. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={handleDelete}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}

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