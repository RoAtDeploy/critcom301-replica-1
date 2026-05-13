import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileAudio, X, Radio, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import RecordingRow from "@/components/monitoring/RecordingRow";

// Placeholder grades cycling for demo
const PLACEHOLDER_GRADES = ["A", "B", "C", "D", "n/a"];
let gradeIndex = 0;
const nextPlaceholderGrade = () => PLACEHOLDER_GRADES[gradeIndex++ % PLACEHOLDER_GRADES.length];

const PLACEHOLDER_RECORDINGS = [
  {
    id: "demo-1",
    name: "recording_001.mp3",
    objectUrl: null,
    transcribing: false,
    grade: "B",
    override: null,
    duration: 87,
    transcription: null,
    segments: [
      { timestamp: "00:00", text: "L1: Signaller, this is Driver reporting a SPAD at signal SN147, I am now stopped." },
      { timestamp: "00:06", text: "L2: Received. Can you confirm your train number and location?" },
      { timestamp: "00:11", text: "L1: Train 2B44, I am stopped at approximately three car lengths past signal SN147 on the up fast line." },
      { timestamp: "00:19", text: "L2: Understood. Are you able to confirm the signal was at danger when you passed it?" },
      { timestamp: "00:24", text: "L1: Affirmative, the signal was showing a red aspect as I passed." },
      { timestamp: "00:29", text: "L2: Received. I am now blocking the line. Do not move the train until you receive further instructions from me." },
      { timestamp: "00:35", text: "L1: Confirmed, train is stopped and will not move without instruction." },
      { timestamp: "00:40", text: "L2: Can you confirm all staff and passengers are safe and there is no damage to your train?" },
      { timestamp: "00:46", text: "L1: All passengers are safe, no apparent damage to the train. Guard has been informed." },
      { timestamp: "00:53", text: "L2: Good. I will now contact the Incident Controller. Remain on this channel. I will call you back shortly." },
      { timestamp: "01:00", text: "L1: Understood, standing by on this channel." },
    ],
  },
  {
    id: "demo-2",
    name: "recording_002.mp3",
    objectUrl: null,
    transcribing: false,
    grade: "A",
    override: null,
    duration: 63,
    transcription: null,
    segments: [
      { timestamp: "00:00", text: "L1: Control, this is the PICOP at Northfield Junction, requesting a line blockage on the down slow between Northfield Junction and Elmbridge." },
      { timestamp: "00:09", text: "L2: Received PICOP Northfield Junction. Can you confirm the nature of the work and the protection required?" },
      { timestamp: "00:15", text: "L1: Track inspection work. We require a possession from 02:00 to 05:30, protection by line blockage only." },
      { timestamp: "00:22", text: "L2: Understood. Can you confirm all persons are clear of the line and you are ready to take possession?" },
      { timestamp: "00:28", text: "L1: Confirmed, all persons are stood back, I am the responsible person in charge." },
      { timestamp: "00:33", text: "L2: Right, I am granting the line blockage. Down slow between Northfield Junction and Elmbridge is now blocked to all movements. Time is zero two zero zero." },
      { timestamp: "00:43", text: "L1: Received. Line blockage confirmed, down slow Northfield Junction to Elmbridge, time zero two zero zero. I will call you when ready to hand back." },
      { timestamp: "00:52", text: "L2: Correct. Maintain communication every thirty minutes or if the situation changes." },
      { timestamp: "00:57", text: "L1: Understood, will do." },
    ],
  },
  {
    id: "demo-3",
    name: "recording_003.mp3",
    objectUrl: null,
    transcribing: false,
    grade: "D",
    flag: "Unprofessional language detected — driver used inappropriate phrasing during communication.",
    override: null,
    duration: 45,
    transcription: null,
    segments: [
      { timestamp: "00:00", text: "L1: Yeah hi, it's me again, erm, there's something on the track I think, near the bridge." },
      { timestamp: "00:05", text: "L2: Can you identify yourself and your location please?" },
      { timestamp: "00:08", text: "L1: Oh right yeah sorry, it's the driver, train erm... four Charlie something, near the viaduct." },
      { timestamp: "00:15", text: "L2: I need your exact train number and milepost or signal reference. Can you provide that?" },
      { timestamp: "00:20", text: "L1: Hang on... it's 4C22 I think. And I'm roughly between signals, I can't see a milepost from here." },
      { timestamp: "00:28", text: "L2: Is this an emergency? Is the train stopped?" },
      { timestamp: "00:31", text: "L1: Yeah well, I've slowed right down, I didn't want to stop on the viaduct though." },
      { timestamp: "00:36", text: "L2: I need you to stop the train now and confirm your exact position before I can take any action." },
      { timestamp: "00:42", text: "L1: Okay, stopping now." },
    ],
  },
  {
    id: "demo-4",
    name: "recording_004.mp3",
    objectUrl: null,
    transcribing: false,
    grade: "C",
    override: { grade: "B", justification: "Reviewed in full — driver recovered well after initial hesitation and all key information was confirmed. Upgraded on reflection." },
    duration: 71,
    transcription: null,
    segments: [
      { timestamp: "00:00", text: "L1: Control, Driver of 1A56, I need to report an obstruction on the line at signal PE203." },
      { timestamp: "00:07", text: "L2: Received, 1A56. What is the nature of the obstruction?" },
      { timestamp: "00:11", text: "L1: There is what appears to be a fallen tree across both running lines. I have stopped the train short of the obstruction." },
      { timestamp: "00:18", text: "L2: Understood. Can you confirm your train is stopped and passengers are safe?" },
      { timestamp: "00:22", text: "L1: Yes, train is stopped. Passengers are... erm, yes they're fine." },
      { timestamp: "00:27", text: "L2: Good. I am implementing emergency block protection now. Do not move the train." },
      { timestamp: "00:33", text: "L1: Confirmed, not moving." },
      { timestamp: "00:35", text: "L2: Is there any risk to persons on the train from the obstruction? Can you see whether the tree is clear of the train?" },
      { timestamp: "00:42", text: "L1: The tree is approximately fifty metres ahead, no immediate risk to the train." },
      { timestamp: "00:48", text: "L2: Received. I am notifying the Incident Controller and Infrastructure Manager. Stay on this channel." },
      { timestamp: "00:54", text: "L1: Understood, standing by." },
    ],
  },
];

const GRADE_CONFIG = {
  A: { label: "A", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  B: { label: "B", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  C: { label: "C", color: "bg-orange-100 text-orange-700 border-orange-300" },
  D: { label: "D", color: "bg-red-100 text-red-700 border-red-300" },
  "n/a": { label: "N/A", color: "bg-slate-100 text-slate-500 border-slate-300" },
};

export default function MonitoringOnMass() {
  const [recordings, setRecordings] = useState(PLACEHOLDER_RECORDINGS);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterGrade, setFilterGrade] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = async (incoming) => {
    const audioFiles = Array.from(incoming).filter(
      (f) => f.type.startsWith("audio/") || f.name.match(/\.(mp3|wav|m4a|ogg|flac|aac)$/i)
    );
    if (!audioFiles.length) return;

    setUploading(true);

    for (const file of audioFiles) {
      const id = crypto.randomUUID();
      const objectUrl = URL.createObjectURL(file);

      // Add to list immediately as transcribing
      setRecordings((prev) => [
        ...prev,
        { id, name: file.name, objectUrl, transcribing: true, grade: null, override: null, segments: null, transcription: null, duration: null },
      ]);

      // Upload then transcribe
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.functions.invoke("transcribeAudio", { file_url });
      const data = result.data;

      setRecordings((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                transcribing: false,
                transcription: data.text,
                segments: data.segments,
                duration: data.duration,
                language: data.language,
                grade: nextPlaceholderGrade(), // placeholder — will be configured later
              }
            : r
        )
      );
    }

    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleGradeOverride = (id, grade, justification) => {
    setRecordings((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (grade === null) {
          const { override, ...rest } = r;
          return rest;
        }
        return { ...r, override: { grade, justification } };
      })
    );
  };

  const removeRecording = (id) => {
    setRecordings((prev) => {
      const rec = prev.find((r) => r.id === id);
      if (rec?.objectUrl) URL.revokeObjectURL(rec.objectUrl);
      return prev.filter((r) => r.id !== id);
    });
  };

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
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-muted-foreground" />
            Upload Recordings
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            <p className="text-xs text-muted-foreground mt-1">or click to browse — MP3, WAV, M4A, AAC supported</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {uploading && (
            <p className="text-xs text-muted-foreground mt-3 text-center animate-pulse">
              Uploading and transcribing recordings…
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recordings List */}
      {recordings.length > 0 && (
        <div className="space-y-3">
          {/* Grade summary / filter bar */}
          {(() => {
            const counts = {};
            const flaggedGrades = new Set();
            recordings.forEach((r) => {
            const g = r.override?.grade ?? r.grade;
            if (g) counts[g] = (counts[g] || 0) + 1;
            if (r.flag && g) flaggedGrades.add(g);
            });
            return (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium mr-1">Filter:</span>
              {["A", "B", "C", "D", "n/a"].filter(g => counts[g]).map((g) => {
                const cfg = GRADE_CONFIG[g];
                const active = filterGrade === g;
                return (
                  <button
                    key={g}
                    onClick={() => setFilterGrade(active ? null : g)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-all ${
                      active
                        ? `${cfg.color} ring-2 ring-offset-1 ring-current/30`
                        : `${cfg.color} opacity-60 hover:opacity-100`
                    }`}
                  >
                    <span>{cfg.label}</span>
                    <span className="opacity-70">×{counts[g]}</span>
                    {flaggedGrades.has(g) && <AlertTriangle className="w-3 h-3" />}
                  </button>
                );
                })}
                {filterGrade && (
                  <button
                    onClick={() => setFilterGrade(null)}
                    className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            );
          })()}

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {recordings.length} Recording{recordings.length > 1 ? "s" : ""}
            </h2>
          </div>

          {recordings.filter((r) => {
            if (!filterGrade) return true;
            const g = r.override?.grade ?? r.grade;
            return g === filterGrade;
          }).map((rec) => (
            <div key={rec.id} className="relative group">
              <RecordingRow recording={rec} onGradeOverride={handleGradeOverride} />
              <button
                onClick={() => removeRecording(rec.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state placeholder */}
      {recordings.length === 0 && !uploading && (
        <div className="text-center py-12 text-muted-foreground">
          <FileAudio className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No recordings uploaded yet.</p>
          <p className="text-xs mt-1">Upload audio files above to begin transcription.</p>
        </div>
      )}
    </motion.div>
  );
}