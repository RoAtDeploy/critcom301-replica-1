import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle2, Clock, AlertCircle, Circle } from "lucide-react";
import { motion } from "framer-motion";

const mockActions = [
  { id: 1, title: "Follow up with client re: pricing quote", staff: "James Walker", date: "May 7, 2026", priority: "high", status: "pending", report: "Sales Call #142" },
  { id: 2, title: "Schedule product training session for new features", staff: "Marcus Johnson", date: "May 6, 2026", priority: "medium", status: "pending", report: "Support Call #89" },
  { id: 3, title: "Send updated contract to enterprise lead", staff: "Sarah Mitchell", date: "May 6, 2026", priority: "high", status: "completed", report: "Sales Call #155" },
  { id: 4, title: "Escalate unresolved complaint to senior manager", staff: "Emily Chen", date: "May 5, 2026", priority: "urgent", status: "in_progress", report: "Complaint #31" },
  { id: 5, title: "Prepare demo environment for Thursday call", staff: "Daniel Kim", date: "May 5, 2026", priority: "medium", status: "pending", report: "Demo Call #22" },
  { id: 6, title: "Update CRM with call notes and next steps", staff: "Olivia Brown", date: "May 4, 2026", priority: "low", status: "completed", report: "Follow-up #67" },
  { id: 7, title: "Send proposal revision by end of week", staff: "James Walker", date: "May 4, 2026", priority: "high", status: "in_progress", report: "Sales Call #138" },
  { id: 8, title: "Review competitor pricing mentioned in call", staff: "Sarah Mitchell", date: "May 3, 2026", priority: "medium", status: "completed", report: "Sales Call #150" },
];

const priorityStyles = {
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
};

const statusConfig = {
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending" },
  in_progress: { icon: AlertCircle, color: "text-chart-3", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-accent", label: "Completed" },
};

export default function ActionItems() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const filtered = mockActions
    .filter((a) => a.title.toLowerCase().includes(search.toLowerCase()) || a.staff.toLowerCase().includes(search.toLowerCase()))
    .filter((a) => tab === "all" || a.status === tab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Action Items</h1>
        <p className="text-muted-foreground mt-1">Tasks generated from call analysis reports.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search actions…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map((action) => {
          const StatusIcon = statusConfig[action.status].icon;
          return (
            <Card key={action.id} className="border-border/50 hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <StatusIcon className={`w-5 h-5 ${statusConfig[action.status].color}`} />
                    </div>
                    <div>
                      <p className="font-medium">{action.title}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                        <span className="text-sm text-muted-foreground">{action.staff}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{action.date}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{action.report}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className={priorityStyles[action.priority]}>
                      {action.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {statusConfig[action.status].label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Circle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No action items found.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}