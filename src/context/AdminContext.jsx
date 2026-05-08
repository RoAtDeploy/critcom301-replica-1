import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const DEFAULTS = {
  roles: ["Sales Rep", "Senior Sales Rep", "Customer Support", "Team Lead", "Manager"],
  departments: ["Sales", "Customer Support", "Retention", "Onboarding", "Operations"],
  lineManagers: ["Alice Thompson", "Bob Harris", "Carol Davies", "David Singh"],
};

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [roles, setRoles] = useState(DEFAULTS.roles);
  const [departments, setDepartments] = useState(DEFAULTS.departments);
  const [lineManagers, setLineManagers] = useState(DEFAULTS.lineManagers);
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);

  const refreshStaff = useCallback(async () => {
    setStaffLoading(true);
    const staff = await base44.entities.StaffMember.list("-created_date");
    setStaffList(staff);
    setStaffLoading(false);
  }, []);

  // Load everything from DB on mount
  useEffect(() => {
    Promise.all([
      base44.entities.StaffMember.list("-created_date"),
      base44.entities.AdminConfig.list(),
    ]).then(([staff, configs]) => {
      setStaffList(staff);

      const rolesConfig = configs.find((c) => c.key === "roles");
      const depsConfig = configs.find((c) => c.key === "departments");
      const lmConfig = configs.find((c) => c.key === "lineManagers");

      if (rolesConfig?.values?.length) setRoles(rolesConfig.values);
      if (depsConfig?.values?.length) setDepartments(depsConfig.values);
      if (lmConfig?.values?.length) setLineManagers(lmConfig.values);

      setStaffLoading(false);
    });
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
    }
    await saveConfig(type, next);
    return true;
  };

  return (
    <AdminContext.Provider value={{
      departments, lineManagers, roles,
      staffList, staffLoading,
      addStaff, updateStaff, refreshStaff,
      addItem, removeItem, editItem,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}