import { Button } from "@/components/ui/button";
import { Loader2, Brain } from "lucide-react";

export default function AiDiarizationToggle({ onRun, loading, error }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
        <Brain className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">AI speaker detection</p>
          <p className="text-xs text-muted-foreground">
            {error || "Analyses the conversation flow to assign speakers. Edit the transcript first, then re-run anytime."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRun}
          disabled={loading}
          className="shrink-0"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analysing…</>
          ) : (
            <><Brain className="w-4 h-4 mr-2" />Run AI</>
          )}
        </Button>
      </div>
    </div>
  );
}