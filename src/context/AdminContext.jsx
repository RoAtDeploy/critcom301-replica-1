import { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const defaultDepartments = ["Sales", "Customer Support", "Retention", "Onboarding", "Operations"];
const defaultLineManagers = ["Alice Thompson", "Bob Harris", "Carol Davies", "David Singh"];
const defaultRoles = ["Sales Rep", "Senior Sales Rep", "Customer Support", "Team Lead", "Manager"];

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [departments, setDepartments] = useState(defaultDepartments);
  const [lineManagers, setLineManagers] = useState(defaultLineManagers);
  const [roles, setRoles] = useState(defaultRoles);
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);

  useEffect(() => {
    base44.entities.StaffMember.list("-created_date").then((list) => {
      setStaffList(list);
      setStaffLoading(false);
    });
  }, []);

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

  const addItem = (type, value) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (type === "departments") {
      if (departments.includes(trimmed)) return false;
      setDepartments((p) => [...p, trimmed]);
    } else if (type === "lineManagers") {
      if (lineManagers.includes(trimmed)) return false;
      setLineManagers((p) => [...p, trimmed]);
    } else if (type === "roles") {
      if (roles.includes(trimmed)) return false;
      setRoles((p) => [...p, trimmed]);
    }
    return true;
  };

  const removeItem = (type, value) => {
    if (type === "departments") setDepartments((p) => p.filter((i) => i !== value));
    else if (type === "lineManagers") setLineManagers((p) => p.filter((i) => i !== value));
    else if (type === "roles") setRoles((p) => p.filter((i) => i !== value));
  };

  const editItem = (type, oldValue, newValue) => {
    const trimmed = newValue.trim();
    if (!trimmed) return false;
    if (type === "departments") setDepartments((p) => p.map((i) => (i === oldValue ? trimmed : i)));
    else if (type === "lineManagers") setLineManagers((p) => p.map((i) => (i === oldValue ? trimmed : i)));
    else if (type === "roles") setRoles((p) => p.map((i) => (i === oldValue ? trimmed : i)));
    return true;
  };

  return (
    <AdminContext.Provider value={{ departments, lineManagers, roles, staffList, staffLoading, addStaff, updateStaff, addItem, removeItem, editItem }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}