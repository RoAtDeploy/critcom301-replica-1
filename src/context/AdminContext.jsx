import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const DEFAULTS = {
  roles: ["Sales Rep", "Senior Sales Rep", "Customer Support", "Team Lead", "Manager"],
  departments: ["Sales", "Customer Support", "Retention", "Onboarding", "Operations"],
  lineManagers: ["Alice Thompson", "Bob Harris", "Carol Davies", "David Singh"],
  callTypes: ["Closing Worksite", "Worksite Set-up", "Emergency Call"],
  actionTemplates: [
    "1:1 coaching session with line manager",
    "Attend safety critical communications refresher training",
    "Complete a written self-reflection on the identified issue",
    "Shadow a colleague to observe best practice communications",
    "Re-read Rule Book Section G1 and complete sign-off sheet",
    "Complete a competency assessment with assessor",
  ],
};

function buildLineManagerData(lmUsers, lmPending, lmRecords) {
  const map = new Map();
  lmUsers.forEach((u) => {
    const name = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.full_name || u.email);
    if (u.email) map.set(u.email.toLowerCase(), { name, email: u.email });
  });
  lmPending.forEach((u) => {
    if (u.email && !map.has(u.email.toLowerCase())) {
      const name = u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email;
      map.set(u.email.toLowerCase(), { name, email: u.email });
    }
  });
  (lmRecords || []).forEach((r) => {
    if (r.email && !map.has(r.email.toLowerCase())) {
      map.set(r.email.toLowerCase(), { name: r.name || r.email, email: r.email });
    }
  });
  const options = Array.from(map.values()).filter((o) => o.name && o.email);
  return { names: options.map((o) => o.name), options };
}

function isLineManagerCandidate(u) {
  return (
    (u.roles || []).includes("line_manager") ||
    (u.roles || []).includes("assessor") ||
    u.role === "line_manager" ||
    u.role === "assessor"
  );
}

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [roles, setRoles] = useState(DEFAULTS.roles);
  const [departments, setDepartments] = useState(DEFAULTS.departments);
  const [lineManagers, setLineManagers] = useState(DEFAULTS.lineManagers);
  const [lineManagerUsers, setLineManagerUsers] = useState([]); // actual User records with line_manager or assessor role
  const [lineManagerOptions, setLineManagerOptions] = useState([]); // [{ name, email }] for staff assignment
  const [callTypes, setCallTypes] = useState(DEFAULTS.callTypes);
  const [actionTemplates, setActionTemplates] = useState(DEFAULTS.actionTemplates);
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);

  const refreshStaff = useCallback(async () => {
    setStaffLoading(true);
    const staff = await base44.entities.StaffMember.list("-created_date");
    setStaffList(staff);
    setStaffLoading(false);
  }, []);

  const refreshLineManagers = useCallback(async () => {
    const [users, pendingUsers, lmRecords] = await Promise.all([
      base44.entities.User.list(),
      base44.entities.PendingUser.list(),
      base44.entities.LineManager.list(),
    ]);
    const lmUsers = users.filter(isLineManagerCandidate);
    const lmPending = pendingUsers.filter(isLineManagerCandidate);
    setLineManagerUsers(lmUsers);
    const lmData = buildLineManagerData(lmUsers, lmPending, lmRecords);
    setLineManagers(lmData.names);
    setLineManagerOptions(lmData.options);
  }, []);

  // Load everything from DB on mount
  useEffect(() => {
    const loadData = async () => {
      const [staff, configs, users, pendingUsers, lmRecords] = await Promise.all([
        base44.entities.StaffMember.list("-created_date"),
        base44.entities.AdminConfig.list(),
        base44.entities.User.list(),
        base44.entities.PendingUser.list(),
        base44.entities.LineManager.list(),
      ]);
      setStaffList(staff);

      const rolesConfig = configs.find((c) => c.key === "roles");
      const depsConfig = configs.find((c) => c.key === "departments");
      const ctConfig = configs.find((c) => c.key === "callTypes");
      const atConfig = configs.find((c) => c.key === "actionTemplates");

      if (rolesConfig?.values?.length) setRoles(rolesConfig.values);
      if (depsConfig?.values?.length) setDepartments(depsConfig.values);
      if (ctConfig?.values?.length) setCallTypes(ctConfig.values);
      if (atConfig?.values?.length) setActionTemplates(atConfig.values);

      // Line managers come from users with role 'line_manager' OR 'assessor' (dual role)
      const lmUsers = users.filter(isLineManagerCandidate);
      const lmPending = pendingUsers.filter(isLineManagerCandidate);
      setLineManagerUsers(lmUsers);
      const lmData = buildLineManagerData(lmUsers, lmPending, lmRecords);
      setLineManagers(lmData.names);
      setLineManagerOptions(lmData.options);

      setStaffLoading(false);
    };
    loadData();

    // Subscribe to User and PendingUser changes to auto-refresh line managers
    const unsubscribeUsers = base44.entities.User.subscribe(() => {
      loadData();
    });
    const unsubscribePending = base44.entities.PendingUser.subscribe(() => {
      loadData();
    });
    const unsubscribeLineManagers = base44.entities.LineManager.subscribe(() => {
      loadData();
    });
    return () => {
      unsubscribeUsers();
      unsubscribePending();
      unsubscribeLineManagers();
    };
  }, []);

  // Helper: upsert a config record by key
  const saveConfig = async (key, values) => {
    const existing = await base44.entities.AdminConfig.filter({ key });
    if (existing.length > 0) {
      await base44.entities.AdminConfig.update(existing[0].id, { values });
    } else {
      await base44.entities.AdminConfig.create({ key, values });
    }
  };

  // Staff
  const addStaff = async (member) => {
    const newMember = await base44.entities.StaffMember.create({
      ...member,
      calls: 0,
      avgScore: 0,
      status: "active",
    });
    setStaffList((prev) => [...prev, newMember]);
    return newMember;
  };

  const updateStaff = async (id, updates) => {
    const updated = await base44.entities.StaffMember.update(id, updates);
    setStaffList((prev) => prev.map((s) => s.id === id ? { ...s, ...updated } : s));
  };

  // Generic config list operations
  const addItem = async (type, value) => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    let next;
    if (type === "roles") {
      if (roles.includes(trimmed)) return false;
      next = [...roles, trimmed];
      setRoles(next);
    } else if (type === "departments") {
      if (departments.includes(trimmed)) return false;
      next = [...departments, trimmed];
      setDepartments(next);
    } else if (type === "lineManagers") {
      if (lineManagers.includes(trimmed)) return false;
      next = [...lineManagers, trimmed];
      setLineManagers(next);
    } else if (type === "callTypes") {
      if (callTypes.includes(trimmed)) return false;
      next = [...callTypes, trimmed];
      setCallTypes(next);
    } else if (type === "actionTemplates") {
      if (actionTemplates.includes(trimmed)) return false;
      next = [...actionTemplates, trimmed];
      setActionTemplates(next);
    }
    await saveConfig(type, next);
    return true;
  };

  const removeItem = async (type, value) => {
    let next;
    if (type === "roles") {
      next = roles.filter((i) => i !== value);
      setRoles(next);
    } else if (type === "departments") {
      next = departments.filter((i) => i !== value);
      setDepartments(next);
    } else if (type === "lineManagers") {
      next = lineManagers.filter((i) => i !== value);
      setLineManagers(next);
    } else if (type === "callTypes") {
      next = callTypes.filter((i) => i !== value);
      setCallTypes(next);
    } else if (type === "actionTemplates") {
      next = actionTemplates.filter((i) => i !== value);
      setActionTemplates(next);
    }
    await saveConfig(type, next);
  };

  const editItem = async (type, oldValue, newValue) => {
    const trimmed = newValue.trim();
    if (!trimmed) return false;

    let next;
    if (type === "roles") {
      next = roles.map((i) => (i === oldValue ? trimmed : i));
      setRoles(next);
    } else if (type === "departments") {
      next = departments.map((i) => (i === oldValue ? trimmed : i));
      setDepartments(next);
    } else if (type === "lineManagers") {
      next = lineManagers.map((i) => (i === oldValue ? trimmed : i));
      setLineManagers(next);
    } else if (type === "callTypes") {
      next = callTypes.map((i) => (i === oldValue ? trimmed : i));
      setCallTypes(next);
    } else if (type === "actionTemplates") {
      next = actionTemplates.map((i) => (i === oldValue ? trimmed : i));
      setActionTemplates(next);
    }
    await saveConfig(type, next);
    return true;
  };

  return (
    <AdminContext.Provider value={{
      departments, lineManagers, lineManagerUsers, lineManagerOptions, roles, callTypes, actionTemplates,
      staffList, staffLoading,
      addStaff, updateStaff, refreshStaff, refreshLineManagers,
      addItem, removeItem, editItem,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}