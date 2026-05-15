import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Shield, User, Mail, Loader2 } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "assessor" });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const all = await base44.entities.User.list();
    setUsers(all);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async () => {
    if (!form.email.trim()) { setError("Email is required."); return; }
    setError("");
    setSuccess("");
    setInviting(true);
    try {
      // Invite with base role (user or admin only)
      const baseRole = form.role === "admin" ? "admin" : "user";
      await base44.users.inviteUser(form.email.trim(), baseRole);
      
      // Get the newly created user
      const allUsers = await base44.entities.User.list();
      const newUser = allUsers.find(u => u.email === form.email.trim());
      
      // If custom role, update it
      if (newUser && form.role !== baseRole) {
        await base44.entities.User.update(newUser.id, { role: form.role });
        newUser.role = form.role;
      }
      
      // Add to list immediately so they're available right away
      if (newUser) {
        setUsers(prev => [...prev, newUser]);
      }
      
      setSuccess(`${form.email.trim()} added. Setup email sent — they can be assigned immediately.`);
      setForm({ firstName: "", lastName: "", email: "", role: "assessor" });
    } catch (err) {
      setError(err.message || "Failed to add user.");
    }
    setInviting(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    await base44.entities.User.update(userId, { role: newRole });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const roleBadge = (role) => {
    if (role === "admin") return <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>;
    if (role === "line_manager") return <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">Line Manager</Badge>;
    return <Badge variant="secondary">Assessor</Badge>;
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
          <select
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="assessor">Assessor</option>
            <option value="line_manager">Line Manager</option>
            <option value="admin">Admin</option>
          </select>
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
              <li key={user.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {(user.full_name || user.email || "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" />{user.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {roleBadge(user.role)}
                  <select
                    value={user.role || "assessor"}
                    onChange={e => handleRoleChange(user.id, e.target.value)}
                    className="h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="assessor">Assessor</option>
                    <option value="line_manager">Line Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Role Permissions</p>
        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Admin</span> — Full access: settings, AI calibration, user management, all reports.</p>
        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Assessor</span> — Can create and manage reports and staff; no access to admin settings or user management. Also available as a line manager.</p>
        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Line Manager</span> — Appears in the line manager dropdown when assigning staff. Assessors can also serve as line managers.</p>
      </div>
    </div>
  );
}