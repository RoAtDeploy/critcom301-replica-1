import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Shield, User, Mail, Loader2 } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("assessor");
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

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setError("");
    setSuccess("");
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
    setSuccess(`Invitation sent to ${inviteEmail.trim()}`);
    setInviteEmail("");
    await fetchUsers();
    setInviting(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    await base44.entities.User.update(userId, { role: newRole });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const roleBadge = (role) => {
    if (role === "admin") return <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>;
    return <Badge variant="secondary">Assessor</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Invite new user */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Invite New User</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Email address…"
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleInvite(); }}
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="assessor">Assessor</option>
            <option value="admin">Admin</option>
          </select>
          <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="gap-2 shrink-0">
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {inviting ? "Sending…" : "Send Invite"}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {success && <p className="text-xs text-accent">{success}</p>}
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
        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Assessor</span> — Can create and manage reports and staff; no access to admin settings or user management.</p>
      </div>
    </div>
  );
}