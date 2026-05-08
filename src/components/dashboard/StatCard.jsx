import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, color }) {
  const colorMap = {
    indigo: "bg-primary/10 text-primary",
    teal: "bg-accent/10 text-accent",
    orange: "bg-chart-3/10 text-chart-3",
    rose: "bg-chart-4/10 text-chart-4",
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300 border-border/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", colorMap[color] || colorMap.indigo)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5">
          <span className={cn(
            "text-sm font-semibold",
            trendUp ? "text-accent" : "text-destructive"
          )}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </Card>
  );
}