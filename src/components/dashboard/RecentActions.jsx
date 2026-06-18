import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function RecentActions() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Report.filter({ status: "staff_reviewed" }, "-updated_date", 10)
      .then((data) => { setReports(data); setLoading(false); });
  }, []);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Awaiting Sign-Off</CardTitle>
        <Link to="/open-assessments">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading && (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
          </div>
        )}
        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
            <ShieldCheck className="w-8 h-8 opacity-30" />
            <p className="text-sm">No reports awaiting sign-off</p>
          </div>
        )}
        {!loading && reports.map((report) => (
          <Link
            key={report.id}
            to={`/reports/${report.id}`}
            className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">{report.staff_name}</p>
                <p className="text-xs text-muted-foreground">
                  {report.call_date
                    ? new Date(report.call_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : "No date"
                  }
                  {report.role ? ` · ${report.role}` : ""}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}