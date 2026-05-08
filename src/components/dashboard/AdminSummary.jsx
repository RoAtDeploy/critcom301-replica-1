import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, Building2, Users, Briefcase, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";

export default function AdminSummary() {
  const { departments, lineManagers, roles } = useAdmin();

  const sections = [
    { label: "Roles", count: roles.length, icon: Briefcase, color: "text-primary bg-primary/10", items: roles },
    { label: "Departments", count: departments.length, icon: Building2, color: "text-accent bg-accent/10", items: departments },
    { label: "Line Managers", count: lineManagers.length, icon: Users, color: "text-chart-3 bg-chart-3/10", items: lineManagers },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-muted-foreground" />
          Admin Overview
        </CardTitle>
        <Link to="/admin">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Manage <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {sections.map(({ label, count, icon: Icon, color, items }) => (
            <div key={label} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-lg font-bold leading-none mt-0.5">{count}</p>
                </div>
              </div>
              <div className="space-y-1">
                {items.slice(0, 3).map((item) => (
                  <p key={item} className="text-xs text-muted-foreground truncate px-2 py-1 rounded bg-muted/40">{item}</p>
                ))}
                {items.length > 3 && (
                  <p className="text-xs text-muted-foreground px-2">+{items.length - 3} more</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}