import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, ArrowLeft, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAdmin } from "@/context/AdminContext";

export default function AddStaff() {
  const { roles, departments, lineManagerOptions, addStaff } = useAdmin();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sentinelId, setSentinelId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedLineManagers, setSelectedLineManagers] = useState([]);
  const [managersOpen, setManagersOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [rolesOpen, setRolesOpen] = useState(false);

  const toggleLineManager = (m) => {
    setSelectedLineManagers((prev) =>
      prev.some((s) => s.email === m.email) ? prev.filter((s) => s.email !== m.email) : [...prev, m]
    );
  };

  const removeLineManager = (email) => {
    setSelectedLineManagers((prev) => prev.filter((s) => s.email !== email));
  };

  const toggleRole = (value) => {
    setSelectedRoles((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  const removeRole = (value) => {
    setSelectedRoles((prev) => prev.filter((r) => r !== value));
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    const newMember = await addStaff({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      sentinelId,
      email,
      phone,
      roles: selectedRoles,
      department,
      lineManagers: selectedLineManagers,
    });
    navigate(`/staff/${newMember.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <Link to="/staff" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Staff
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add Staff Member</h1>
        <p className="text-muted-foreground mt-1">Register a new team member to start tracking their call performance.</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Personal Information
          </CardTitle>
          <CardDescription>Enter the staff member's basic details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
              <Input id="firstName" placeholder="e.g. Sarah" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
              <Input id="lastName" placeholder="e.g. Mitchell" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          {/* Sentinel / ID */}
          <div className="space-y-2">
            <Label htmlFor="sentinelId">
              Sentinel / ID Number
              <span className="ml-2 text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input id="sentinelId" placeholder="e.g. SNT-00142" value={sentinelId} onChange={(e) => setSentinelId(e.target.value)} />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address
              <span className="ml-2 text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input id="email" type="email" placeholder="sarah.mitchell@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {/* Phone with +44 prefix */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number
              <span className="ml-2 text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <div className="flex">
              <div className="flex items-center px-3 border border-r-0 border-input rounded-l-md bg-muted text-sm font-medium text-muted-foreground select-none">
                🇬🇧 +44
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="7700 900 000"
                className="rounded-l-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Roles — multi-select from admin context */}
          <div className="space-y-2">
            <Label>Role <span className="text-destructive">*</span></Label>

            {selectedRoles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedRoles.map((r) => (
                  <Badge key={r} variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1 pr-1">
                    {r}
                    <button type="button" onClick={() => removeRole(r)} className="ml-1 hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setRolesOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-input bg-background text-sm text-left hover:bg-muted/40 transition-colors"
              >
                <span className={selectedRoles.length === 0 ? "text-muted-foreground" : ""}>
                  {selectedRoles.length === 0 ? "Select roles…" : `${selectedRoles.length} selected`}
                </span>
                <svg className={`w-4 h-4 text-muted-foreground transition-transform ${rolesOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {rolesOpen && (
                <div className="absolute z-20 mt-1 w-full bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                  {roles.map((role) => {
                    const checked = selectedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-muted transition-colors ${checked ? "bg-primary/5" : ""}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary border-primary" : "border-input"}`}>
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        {role}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Department — from admin context */}
          <div className="space-y-2">
            <Label>
              Department
              <span className="ml-2 text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Line Managers — multi-select */}
          <div className="space-y-2">
            <Label>
              Line Manager(s)
              <span className="ml-2 text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            {selectedLineManagers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedLineManagers.map((m) => (
                  <Badge key={m.email} variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1 pr-1">
                    {m.name}
                    <button type="button" onClick={() => removeLineManager(m.email)} className="ml-1 hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setManagersOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-input bg-background text-sm text-left hover:bg-muted/40 transition-colors"
              >
                <span className={selectedLineManagers.length === 0 ? "text-muted-foreground" : ""}>
                  {selectedLineManagers.length === 0 ? "Select line manager(s)…" : `${selectedLineManagers.length} selected`}
                </span>
                <svg className={`w-4 h-4 text-muted-foreground transition-transform ${managersOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {managersOpen && (
                <div className="absolute z-20 mt-1 w-full bg-popover border border-border rounded-md shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                  {lineManagerOptions.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-muted-foreground">No line managers available. Invite a user with the line manager role first.</p>
                  ) : lineManagerOptions.map((m) => {
                    const checked = selectedLineManagers.some((s) => s.email === m.email);
                    return (
                      <button
                        key={m.email}
                        type="button"
                        onClick={() => toggleLineManager(m)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-muted transition-colors ${checked ? "bg-primary/5" : ""}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary border-primary" : "border-input"}`}>
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
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

          <div className="flex justify-end gap-3 pt-4">
            <Link to="/staff">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={!firstName.trim() || !lastName.trim()}
              onClick={handleSubmit}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}