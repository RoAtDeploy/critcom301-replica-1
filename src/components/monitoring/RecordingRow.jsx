import { useState, useRef } from "react";
import { ChevronDown, ChevronUp, Play, Pause, Pencil, X, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const GRADE_CONFIG = {
  A: { label: "A", color: "bg-emerald-100 text-emerald-700 border-emerald-300", description: "NO ACTION REQUIRED" },
  B: { label: "B", color: "bg-yellow-100 text-yellow-700 border-yellow-300", description: "FEEDBACK REQUIRED" },
  C: { label: "C", color: "bg-orange-100 text-orange-700 border-orange-300", description: "DAP REQUIRED" },
  D: { label: "D", color: "bg-red-100 text-red-700 border-red-300", description: "IMMEDIATE ACTION REQUIRED" },
  "n/a": { label: "N/A", color: "bg-slate-100 text-slate-500 border-slate-300", description: "Not Applicable" },
};

const GRADES = ["A", "B", "C", "D", "n/a"];

function GradeBadge({ grade }) {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG["n/a"];
  return (
    <span className={`inline-flex items-center justify-center rounded border w-7 h-7 text-xs font-bold shrink-0 ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function GradeSelector({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {GRADES.map((g) => {
        const cfg = GRADE_CONFIG[g];
        const isSelected = value === g;
        return (
          <button
            key={g}
            onClick={() => onChange(g)}
            className={`w-8 h-8 text-xs font-bold rounded border-2 transition-all ${
              isSelected
                ? `${cfg.color} border-current ring-2 ring-offset-1 ring-current/30`
                : "bg-background border-border text-muted-foreground hover:border-current/40"
            }`}
          >
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

function AudioPlayer({ url, name }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={toggle}
        className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-colors shrink-0"
      >
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
      </button>
      {duration > 0 && (
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full transition-all"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
            {fmt(progress)} / {fmt(duration)}
          </span>
        </div>
      )}
    </div>
  );
}

export default function RecordingRow({ recording, onGradeOverride }) {
  const [open, setOpen] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [justification, setJustification] = useState("");
  const [saving, setSaving] = useState(false);

  const effectiveGrade = recording.override?.grade ?? recording.grade;
  const cfg = effectiveGrade ? GRADE_CONFIG[effectiveGrade] : null;

  const handleSaveOverride = async () => {
    if (!selectedGrade || !justification.trim()) return;
    setSaving(true);
    await onGradeOverride(recording.id, selectedGrade, justification.trim());
    setOverriding(false);
    setJustification("");
    setSelectedGrade(null);
    setSaving(false);
  };

  const handleRemoveOverride = async () => {
    setSaving(true);
    await onGradeOverride(recording.id, null, null);
    setOverriding(false);
    setSaving(false);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn(
        "rounded-lg border overflow-hidden",
        cfg ? cfg.color.split(" ")[2] : "border-slate-200"
      )}>
        {/* Collapsed Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* File name */}
          <button onClick={() => setOpen(o => !o)} className="flex-1 text-left min-w-0">
            <span className="text-sm font-medium text-foreground truncate block">{recording.name}</span>
            {recording.transcribing && (
              <span className="text-xs text-muted-foreground">Transcribing…</span>
            )}
            {!recording.transcribing && recording.duration && (
              <span className="text-xs text-muted-foreground">{Math.round(recording.duration)}s</span>
            )}
          </button>

          {/* Audio player (collapsed) */}
          {recording.objectUrl && !open && (
            <AudioPlayer url={recording.objectUrl} name={recording.name} />
          )}

          {/* Grade description */}
          {effectiveGrade && !open && (
            <span className="text-xs text-muted-foreground hidden sm:block shrink-0">
              {GRADE_CONFIG[effectiveGrade]?.description}
              {recording.override && <span className="ml-1 opacity-60">(overridden)</span>}
            </span>
          )}

          {/* Override button */}
          {effectiveGrade && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
              onClick={(e) => { e.stopPropagation(); setOverriding(o => !o); setOpen(true); }}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Override
            </Button>
          )}

          <button onClick={() => setOpen(o => !o)}>
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {/* Grade Badge — far right */}
          <div className="shrink-0">
            {effectiveGrade ? (
              <GradeBadge grade={effectiveGrade} />
            ) : recording.transcribing ? (
              <span className="w-7 h-7 inline-flex items-center justify-center rounded border border-dashed border-slate-300">
                <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
              </span>
            ) : (
              <span className="w-7 h-7 inline-flex items-center justify-center rounded border border-dashed border-slate-300 text-slate-400 text-xs font-bold">?</span>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {open && (
          <div className="px-4 pb-4 pt-0 border-t border-border/30 space-y-3">
            {/* Audio player (expanded) */}
            {recording.objectUrl && (
              <div className="pt-3">
                <AudioPlayer url={recording.objectUrl} name={recording.name} />
              </div>
            )}

            {/* Transcript */}
            {recording.segments?.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 pt-1">
                {recording.segments.map((seg, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 rounded px-2 py-0.5 h-fit whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {seg.timestamp}
                    </span>
                    <p className="text-foreground leading-relaxed">{seg.text}</p>
                  </div>
                ))}
              </div>
            ) : recording.transcription ? (
              <p className="text-sm text-foreground/75 leading-relaxed pt-1">{recording.transcription}</p>
            ) : recording.transcribing ? (
              <p className="text-sm text-muted-foreground pt-1">Transcribing…</p>
            ) : (
              <p className="text-sm text-muted-foreground pt-1">No transcript available yet.</p>
            )}

            {/* Override panel */}
            {recording.override && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 space-y-1">
                <p className="text-xs font-semibold text-amber-700">Override justification</p>
                <p className="text-sm text-amber-800">{recording.override.justification}</p>
              </div>
            )}

            {overriding && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-foreground">Select new grade and provide a justification:</p>
                <GradeSelector value={selectedGrade} onChange={setSelectedGrade} />
                <Textarea
                  placeholder="Enter reason for override…"
                  className="h-20 resize-none text-sm"
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={handleSaveOverride} disabled={!selectedGrade || !justification.trim() || saving} className="text-xs bg-primary hover:bg-primary/90">
                    Save Override
                  </Button>
                  {recording.override && (
                    <Button size="sm" variant="outline" onClick={handleRemoveOverride} disabled={saving} className="text-xs">
                      Remove override
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { setOverriding(false); setJustification(""); setSelectedGrade(null); }} className="text-xs">
                    <X className="w-3 h-3 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}