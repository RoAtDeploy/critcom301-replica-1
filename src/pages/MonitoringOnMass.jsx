import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileAudio, X, Radio, AlertTriangle, User, Loader2, Zap, Trash2, CheckSquare, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import RecordingRow from "@/components/monitoring/RecordingRow";

const GRADE_CONFIG = {
  A: { label: "A", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  B: { label: "B", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  C: { label: "C", color: "bg-orange-100 text-orange-700 border-orange-300" },
  D: { label: "D", color: "bg-red-100 text-red-700 border-red-300" },
  "n/a": { label: "N/A", color: "bg-slate-100 text-slate-500 border-slate-300" },
  X: { label: "X", color: "bg-slate-100 text-slate-400 border-slate-200" },
};

export default function MonitoringOnMass() {
  const [staged, setStaged] = useState([]); // { id, file, objectUrl, name, staffId, staffName }
  const [processed, setProcessed] = useState([]); // fully processed Recording records
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [filterGrade, setFilterGrade] = useState(null);
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("unknown");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.StaffMember.list().then(setStaffMembers).catch(() => {});
    // Load existing recordings from DB on mount
    base44.entities.Recording.list("-created_date", 50).then(recs => {
      setProcessed(recs.map(r => ({ ...r, _source: "db" })));
    }).catch(() => {});
  }, []);

  const selectedStaffObj = selectedStaff !== "unknown" ? staffMembers.find(s => s.id === selectedStaff) : null;

  const handleFiles = (incoming) => {
    const audioFiles = Array.from(incoming).filter(
      (f) => f.type.startsWith("audio/") || f.name.match(/\.(mp3|wav|m4a|ogg|flac|aac)$/i)
    );
    if (!audioFiles.length) return;

    const newStaged = audioFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      objectUrl: URL.createObjectURL(file),
      name: file.name,
      staffId: selectedStaffObj?.id ?? null,
      staffName: selectedStaffObj?.name ?? null,
    }));
    setStaged(prev => [...prev, ...newStaged]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeStaged = (id) => {
    setStaged(prev => {
      const rec = prev.find(r => r.id === id);
      if (rec?.objectUrl) URL.revokeObjectURL(rec.objectUrl);
      return prev.filter(r => r.id !== id);
    });
  };

  const handleProcessAll = async () => {
    if (!staged.length || processing) return;
    setProcessing(true);

    const toProcess = [...staged];
    setStaged([]);

    // Kick off all uploads + processing in parallel
    const results = await Promise.allSettled(
      toProcess.map(async (item) => {
        // Mark as uploading in UI
        setProcessed(prev => [...prev, { id: item.id, name: item.name, staff_name: item.staffName, _status: "uploading", objectUrl: item.objectUrl }]);

        const { file_url } = await base44.integrations.Core.UploadFile({ file: item.file });

        // Mark as processing
        setProcessed(prev => prev.map(r => r.id === item.id ? { ...r, _status: "processing" } : r));

        const result = await base44.functions.invoke("processRecording", {
          file_url,
          file_name: item.name,
          staff_id: item.staffId,
          staff_name: item.staffName,
        });

        const { recording } = result.data;

        // Replace placeholder with real DB record
        setProcessed(prev => prev.map(r =>
          r.id === item.id
            ? { ...recording, objectUrl: item.objectUrl, _status: "done", _source: "db" }
            : r
        ));

        URL.revokeObjectURL(item.objectUrl);
        return recording;
      })
    );

    // Mark any failures
    results.forEach((res, i) => {
      if (res.status === "rejected") {
        const item = toProcess[i];
        setProcessed(prev => prev.map(r =>
          r.id === item.id ? { ...r, _status: "failed" } : r
        ));
      }
    });

    setProcessing(false);
  };

  const handleGradeOverride = async (id, grade, justification) => {
    if (grade === null) {
      await base44.entities.Recording.update(id, { override: null });
      setProcessed(prev => prev.map(r => r.id === id ? { ...r, override: null } : r));
    } else {
      const override = { grade, justification };
      await base44.entities.Recording.update(id, { override });
      setProcessed(prev => prev.map(r => r.id === id ? { ...r, override } : r));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const dbIds = allRecordings.filter(r => r._source === "db").map(r => r.id);
    if (dbIds.every(id => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(dbIds));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.size) return;
    setDeleting(true);
    await Promise.allSettled([...selectedIds].map(id => base44.entities.Recording.delete(id)));
    setProcessed(prev => prev.filter(r => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    setDeleting(false);
  };

  const handleGenerateReport = (recording) => {
    const params = new URLSearchParams();
    if (recording.staff_id) params.set("staffId", recording.staff_id);
    if (recording.id && recording._source === "db") params.set("recordingId", recording.id);
    navigate(`/reports/new?${params.toString()}`);
  };

  // Recordings to display (processed/in-progress)
  const allRecordings = processed.filter(r => {
    if (filterFlagged && !r.flag) return false;
    if (filterGrade) {
      const g = r.override?.grade ?? r.grade;
      return g === filterGrade;
    }
    return true;
  });

  const gradeCounts = {};
  let flaggedCount = 0;
  processed.forEach(r => {
    const g = r.override?.grade ?? r.grade;
    if (g) gradeCounts[g] = (gradeCounts[g] || 0) + 1;
    if (r.flag) flaggedCount++;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Radio className="w-6 h-6 text-orange-500" />
          Monitoring on Mass
        </h1>
        <p className="text-muted-foreground mt-1">Upload multiple recordings for bulk transcription and analysis.</p>
      </div>

      {/* Upload Zone */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4 text-muted-foreground" />
              Upload Recordings
            </CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              <User className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="h-8 text-xs w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown / Unassigned</SelectItem>
                  {staffMembers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragging ? "border-orange-400 bg-orange-50" : "border-border hover:border-orange-300 hover:bg-muted/40"
            }`}
          >
            <FileAudio className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Drag & drop audio files here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse — MP3, WAV, M4A, AAC, OGG, FLAC supported</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Staged files list */}
          {staged.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Staged — ready to process ({staged.length})
              </p>
              {staged.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                  <FileAudio className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium flex-1 truncate">{item.name}</span>
                  {item.staffName && (
                    <span className="text-xs text-primary/70 shrink-0">{item.staffName}</span>
                  )}
                  <button onClick={() => removeStaged(item.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <Button
                onClick={handleProcessAll}
                disabled={processing}
                className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white mt-1"
              >
                {processing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                ) : (
                  <><Zap className="w-4 h-4" /> Analyse {staged.length} Recording{staged.length !== 1 ? "s" : ""}</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Recordings List */}
      {processed.length > 0 && (
        <div className="space-y-3">
          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium mr-1">Filter:</span>
            {["A", "B", "C", "D", "n/a", "X"].filter(g => gradeCounts[g]).map((g) => {
              const cfg = GRADE_CONFIG[g];
              const active = filterGrade === g;
              return (
                <button
                  key={g}
                  onClick={() => setFilterGrade(active ? null : g)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-all ${
                    active ? `${cfg.color} ring-2 ring-offset-1 ring-current/30` : `${cfg.color} opacity-60 hover:opacity-100`
                  }`}
                >
                  <span>{cfg.label}</span>
                  <span className="opacity-70">×{gradeCounts[g]}</span>
                </button>
              );
            })}
            {flaggedCount > 0 && (
              <button
                onClick={() => setFilterFlagged(f => !f)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-all ${
                  filterFlagged
                    ? "bg-red-50 text-red-600 border-red-300 ring-2 ring-offset-1 ring-red-300/30"
                    : "bg-red-50 text-red-600 border-red-300 opacity-60 hover:opacity-100"
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span className="opacity-70">×{flaggedCount} flagged</span>
              </button>
            )}
            {(filterGrade || filterFlagged) && (
              <button onClick={() => { setFilterGrade(null); setFilterFlagged(false); }} className="text-xs text-muted-foreground hover:text-foreground underline ml-1">
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground transition-colors">
                {allRecordings.filter(r => r._source === "db").every(r => selectedIds.has(r.id)) && allRecordings.filter(r => r._source === "db").length > 0
                  ? <CheckSquare className="w-4 h-4" />
                  : <Square className="w-4 h-4" />
                }
              </button>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {processed.length} Recording{processed.length !== 1 ? "s" : ""}
              </h2>
            </div>
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="text-xs gap-1.5"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Delete {selectedIds.size} selected
              </Button>
            )}
          </div>

          {allRecordings.map((rec) => {
            // In-progress states
            if (rec._status === "uploading" || rec._status === "processing") {
              return (
                <div key={rec.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500 shrink-0" />
                  <span className="text-sm font-medium flex-1 truncate">{rec.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {rec._status === "uploading" ? "Uploading…" : "Transcribing & analysing…"}
                  </span>
                </div>
              );
            }
            if (rec._status === "failed") {
              return (
                <div key={rec.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 bg-red-50">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-sm font-medium flex-1 truncate text-red-700">{rec.name}</span>
                  <span className="text-xs text-red-500">Processing failed</span>
                </div>
              );
            }
            return (
              <div key={rec.id} className="flex items-center gap-2">
                <button onClick={() => toggleSelect(rec.id)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  {selectedIds.has(rec.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <RecordingRow
                    recording={{ ...rec, objectUrl: rec.objectUrl ?? null }}
                    onGradeOverride={handleGradeOverride}
                    onGenerateReport={handleGenerateReport}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {processed.length === 0 && staged.length === 0 && !processing && (
        <div className="text-center py-12 text-muted-foreground">
          <FileAudio className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No recordings yet.</p>
          <p className="text-xs mt-1">Upload audio files above, then click Analyse to begin.</p>
        </div>
      )}
    </motion.div>
  );
}