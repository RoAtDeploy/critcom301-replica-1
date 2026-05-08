import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const mockActions = [
  { id: 1, title: "Follow up with client re: pricing", staff: "James Walker", priority: "high", status: "pending" },
  { id: 2, title: "Schedule product training session", staff: "Marcus Johnson", priority: "medium", status: "pending" },
  { id: 3, title: "Send updated contract to lead", staff: "Sarah Mitchell", priority: "high", status: "completed" },
  { id: 4, title: "Escalate complaint to manager", staff: "Emily Chen", priority: "urgent", status: "in_progress" },
];

const priorityStyles = {
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
};

const statusIcons = {
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
  in_progress: <AlertCircle className="w-4 h-4 text-chart-3" />,
  completed: <CheckCircle2 className="w-4 h-4 text-accent" />,
};

export default function RecentActions() {
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Action Items</CardTitle>
        <Link to="/actions">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {mockActions.map((action) => (
          <div
            key={action.id}
            className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {statusIcons[action.status]}
              <div>
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.staff}</p>
              </div>
            </div>
            <Badge variant="secondary" className={priorityStyles[action.priority]}>
              {action.priority}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}