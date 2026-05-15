import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0h 0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function CallTimeCard() {
  const [allTime, setAllTime] = useState(null);
  const [lastMonth, setLastMonth] = useState(null);

  useEffect(() => {
    // Fetch all-time accumulator
    base44.entities.AdminConfig.filter({ key: 'allTimeCallSeconds' })
      .then(res => {
        const val = parseFloat(res[0]?.values?.[0] || '0');
        setAllTime(val);
      })
      .catch(() => setAllTime(0));

    // Fetch last month's recordings for the subtitle
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    base44.entities.Recording.list('-created_date', 500)
      .then(recs => {
        const recent = recs.filter(r => new Date(r.created_date) >= oneMonthAgo);
        const total = recent.reduce((sum, r) => sum + (r.duration || 0), 0);
        setLastMonth(total);
      })
      .catch(() => setLastMonth(0));
  }, []);

  const allTimeLabel = allTime === null ? "—" : formatDuration(allTime);
  const lastMonthLabel = lastMonth === null ? "" : `${formatDuration(lastMonth)} in last 30 days`;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300 border-border/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Talk Time Analysed</p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{allTimeLabel}</p>
          {lastMonthLabel && (
            <p className="text-sm text-muted-foreground mt-1">{lastMonthLabel}</p>
          )}
        </div>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", "bg-chart-4/10 text-chart-4")}>
          <Clock className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <span className="text-sm font-semibold text-accent">↑ All time</span>
        <span className="text-xs text-muted-foreground">· manually reviewed time saved</span>
      </div>
    </Card>
  );
}