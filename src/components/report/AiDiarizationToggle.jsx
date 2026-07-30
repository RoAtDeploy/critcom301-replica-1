import { Switch } from "@/components/ui/switch";
import { Loader2, Brain } from "lucide-react";

export default function AiDiarizationToggle({ enabled, onToggle, loading, error }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
      <Brain className="w-4 h-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">AI speaker detection</p>
        <p className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>
          {error || "Uses AI to analyse the conversation flow and assign speakers logically"}
        </p>
      </div>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
      ) : (
        <Switch checked={enabled} onCheckedChange={onToggle} />
      )}
    </div>
  );
}