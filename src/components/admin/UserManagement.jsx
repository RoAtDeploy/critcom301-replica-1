import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Shield, User, Mail, Loader2 } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import UserTypeSelect from "@/components/admin/UserTypeSelect";

const derivePrimaryRole = (rolesArr) => {
  const cleaned = (rolesArr || []).map((r) => (r === "line_manager" ? "assessor" : r)).filter(Boolean);
  if (cleaned.length === 0) return "assessor";
  if (cleaned.includes("admin")) return "admin";
  return cleaned[0];
};

const normaliseRoles = (user) => {
  const raw = user.roles && user.roles.length ? user.roles : user.role ? [user.role] : ["assessor"];
  return [...new Set(raw.map((r) => (r === "line_manager" ? "assessor" : r)))];
};

export default function UserManagement() {
  const { refreshLineManagers } = useAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", roles: ["assessor"] });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const [appUsers, pendingUsers] = await Promise.all([
      base44.entities.User.list(),
      base44.entities.PendingUser.list()
    ]);
    const combined = [
      ...appUsers,
      ...pendingUsers.map(p => ({
        ...p,
        full_name: p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.email,
        is_pending: true
      }))
    ];
    setUsers(combined);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async () => {
    if (!form.email.trim()) { setError("Email is required."); return; }
    setError("");
    setSuccess("");
    setInviting(true);
    try {
      // Create pending user placeholder in database
      const roles = form.roles.length ? form.roles : ["assessor"];
      const pendingUser = await base44.entities.PendingUser.create({
        email: form.email.trim(),
        firstName: form.firstName,
        lastName: form.lastName,
        roles,
        role: derivePrimaryRole(roles),
        status: "pending"
      });
      
      // Show in UI immediately
      setUsers(prev => [...prev, {
        id: pendingUser.id,
        email: pendingUser.email,
        full_name: form.firstName && form.lastName ? `${form.firstName} ${form.lastName}` : form.email.trim(),
        roles,
        role: derivePrimaryRole(roles),
        is_pending: true
      }]);
      
      setSuccess(`${form.email.trim()} added as pending. Ready to invite when needed.`);
      setForm({ firstName: "", lastName: "", email: "", roles: ["assessor"] });
      
      // Refresh line managers in AdminContext so dropdown updates
      await refreshLineManagers();
    } catch (err) {
      setError(err.message || "Failed to add user.");
    }
    setInviting(false);
  };

  const handleRolesChange = async (userId, newRoles) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const roles = newRoles.length ? newRoles : ["assessor"];
    const primaryRole = derivePrimaryRole(roles);
    
    if (user.is_pending) {
      await base44.entities.PendingUser.update(userId, { roles, role: primaryRole });
    } else {
      await base44.entities.User.update(userId, { roles, role: primaryRole });
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles, role: primaryRole } : u));
  };

  const typeBadges = (user) => {
    const types = normaliseRoles(user);
    return types.map(t => {
      if (t === "admin") return <Badge key={t} className="bg-primary/10 text-primary border-primary/20">Admin</Badge>;
      if (t === "line_manager") return <Badge key={t} className="bg-chart-3/10 text-chart-3 border-chart-3/20">Line Manager</Badge>;
      return <Badge key={t} variant="secondary">Assessor</Badge>;
    });
  };

  return (
    <div className="space-y-6">
      {/* Add new user */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Add New User</h3>
          <span className="text-xs text-muted-foreground ml-1">— they'll receive an email to set their password</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="First name"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={form.firstName}
            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Last name"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={form.lastName}
            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
          />
          <input
            type="email"
            placeholder="Email address *"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
          />
          <UserTypeSelect value={form.roles} onChange={(roles) => setForm(f => ({ ...f, roles }))} />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleAdd} disabled={inviting || !form.email.trim()} className="gap-2 shrink-0">
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {inviting ? "Setting up…" : "Add User"}
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {success && <p className="text-xs text-accent">{success}</p>}
        </div>
      </div>

      {/* User list */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">App Users</h3>
          <span className="ml-auto text-xs text-muted-foreground">{users.length} user{users.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No users yet. Invite someone above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {users.map(user => (
              <li key={user.id} className={`flex items-center gap-3 px-5 py-3 ${user.is_pending ? "bg-muted/30" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${user.is_pending ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                  <span className="text-xs font-bold">
                    {(user.full_name || user.email || "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${user.is_pending ? "text-muted-foreground" : ""}`}>{user.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" />{user.email}
                    {user.is_pending && <span className="ml-1 text-xs font-medium text-chart-3">Pending</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                    {typeBadges(user)}
                  </div>
                  <UserTypeSelect
                    value={normaliseRoles(user)}
                    onChange={(roles) => handleRolesChange(user.id, roles)}
                    compact
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Role Permissions</p>
        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Admin</span> — Full access: settings, AI calibration, user management, all reports.</p>
        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Assessor</span> — Can create and manage reports and staff; no access to admin settings or user management.</p>
        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Line managers</span> are managed separately in General Settings and do not need app access. If a line manager needs to log in, invite them here as an Admin or Assessor as well.</p>
      </div>
    </div>
  );
}