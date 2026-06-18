import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const STATUS_CONFIG = {
  draft:          { label: "Draft",          className: "bg-muted text-muted-foreground border-border" },
  saved:          { label: "Saved",          className: "bg-secondary text-secondary-foreground border-border" },
  sent:           { label: "Sent",           className: "bg-primary/10 text-primary border-primary/20" },
  staff_reviewed: { label: "Staff Reviewed", className: "bg-accent/10 text-accent border-accent/20" },
  signed_off:     { label: "Signed Off",     className: "bg-emerald-100 text-emerald-700 border-emerald-300" },
};

export default function RecentReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Report.list("-updated_date", 5).then((data) => {
      setReports(data);
      setLoading(false);
    });
  }, []);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Recent Reports</CardTitle>
        <Link to="/open-assessments">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? (
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-28 bg-muted rounded animate-pulse" />
                    <div className="h-2.5 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-5 w-20 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No reports yet.</p>
        ) : (
          reports.map((report) => {
            const cfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.draft;
            const date = report.updated_date
              ? new Date(report.updated_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : "-";
            return (
              <Link key={report.id} to={`/reports/${report.id}`}>
                <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{report.staff_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{date}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cfg.className}>
                    {cfg.label}
                  </Badge>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}