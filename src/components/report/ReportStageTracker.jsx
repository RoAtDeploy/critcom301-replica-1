import { CheckCircle2 } from "lucide-react";

const STAGES = [
  { key: "draft", label: "Awaiting Assessor Review" },
  { key: "saved", label: "Awaiting Send to Staff" },
  { key: "sent", label: "Awaiting Staff Action" },
  { key: "staff_reviewed", label: "Awaiting Sign-off" },
  { key: "signed_off", label: "Signed Off" },
];

const ORDER = ["draft", "saved", "sent", "staff_reviewed", "signed_off"];

export default function ReportStageTracker({ status }) {
  const currentIndex = ORDER.indexOf(status ?? "draft");

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-max gap-0">
        {STAGES.map((stage, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          // "signed_off" is the terminal state — treat it as fully done (green)
          const isSignedOff = status === "signed_off" && stage.key === "signed_off";
          const showDone = done || isSignedOff;
          const showActive = active && !isSignedOff;
          return (
            <div key={stage.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    showDone
                      ? "bg-accent border-accent text-white"
                      : showActive
                      ? "bg-primary border-primary text-white"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  {showDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs font-medium text-center max-w-[80px] leading-tight ${
                    showActive
                      ? "text-foreground"
                      : showDone
                      ? "text-accent"
                      : "text-muted-foreground"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`w-10 h-px mx-1 mb-5 shrink-0 ${
                    i < currentIndex ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}