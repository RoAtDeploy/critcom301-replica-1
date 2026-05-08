import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const mockReports = [
  { id: 1, staffName: "Sarah Mitchell", date: "May 7, 2026", score: 92, status: "completed" },
  { id: 2, staffName: "James Walker", date: "May 6, 2026", score: 78, status: "completed" },
  { id: 3, staffName: "Emily Chen", date: "May 6, 2026", score: 85, status: "completed" },
  { id: 4, staffName: "Marcus Johnson", date: "May 5, 2026", score: 64, status: "needs_review" },
  { id: 5, staffName: "Olivia Brown", date: "May 5, 2026", score: 91, status: "completed" },
];

const scoreColor = (score) => {
  if (score >= 85) return "text-accent";
  if (score >= 70) return "text-chart-3";
  return "text-destructive";
};

export default function RecentReports() {
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Recent Reports</CardTitle>
        <Link to="/staff">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {mockReports.map((report) => (
          <div
            key={report.id}
            className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{report.staffName}</p>
                <p className="text-xs text-muted-foreground">{report.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${scoreColor(report.score)}`}>
                {report.score}%
              </span>
              <Badge
                variant="secondary"
                className={
                  report.status === "completed"
                    ? "bg-accent/10 text-accent border-accent/20"
                    : "bg-chart-3/10 text-chart-3 border-chart-3/20"
                }
              >
                {report.status === "completed" ? "Completed" : "Review"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}