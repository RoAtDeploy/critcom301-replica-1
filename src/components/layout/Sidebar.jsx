import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Headphones,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Radio,
  BookOpen,
  ClipboardList
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Open Assessments", icon: ClipboardList, path: "/open-assessments" },
  { label: "Staff Members", icon: Users, path: "/staff" },
  { label: "Generate Report", icon: FileText, path: "/reports/new" },
  { label: "Monitoring on Mass", icon: Radio, path: "/monitoring" },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openCount, setOpenCount] = useState(null);
  const [activeStaffCount, setActiveStaffCount] = useState(null);

  useEffect(() => {
    base44.entities.Report.list().then(reports => {
      const open = reports.filter(r => r.status !== "signed_off").length;
      setOpenCount(open);
    }).catch(() => {});
    base44.entities.StaffMember.list().then(staff => {
      const active = staff.filter(s => s.status === "active").length;
      setActiveStaffCount(active);
    }).catch(() => {});
  }, []);

  const isActive = (path) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const NavLink = ({ item }) => (
    <Link
      to={item.path}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        isActive(item.path)
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon className="w-5 h-5 shrink-0 text-orange-500" />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.path === "/open-assessments" && openCount > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center leading-tight">
              {openCount}
            </span>
          )}
          {item.path === "/staff" && activeStaffCount != null && (
            <span className="bg-sidebar-accent text-sidebar-foreground text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center leading-tight">
              {activeStaffCount}
            </span>
          )}
        </>
      )}
    </Link>
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col z-50 transition-all duration-300 border-r border-sidebar-border",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[72px] border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
          <Headphones className="w-5 h-5 text-orange-500" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-sidebar-accent-foreground tracking-tight">
            CritCom<span className="text-orange-500">301</span>
          </span>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {!collapsed && (
          <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-3">
            Main
          </p>
        )}
        {navItems.map((item) => <NavLink key={item.path} item={item} />)}
      </nav>

      {/* Admin Section */}
      <div className="px-3 pb-3 border-t border-sidebar-border pt-4 space-y-1">
        {!collapsed && (
          <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-3">
            Admin
          </p>
        )}
        <NavLink item={{ label: "Admin", icon: Settings2, path: "/admin" }} />
        <NavLink item={{ label: "User Guide", icon: BookOpen, path: "/user-guide" }} />
      </div>

      {/* Collapse Toggle */}
      <div className="px-3 pb-5 pt-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}