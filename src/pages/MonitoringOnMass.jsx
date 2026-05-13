import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileAudio, X, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import RecordingRow from "@/components/monitoring/RecordingRow";

// Placeholder grades cycling for demo
const PLACEHOLDER_GRADES = ["A", "B", "C", "D", "n/a"];
let gradeIndex = 0;
const nextPlaceholderGrade = () => PLACEHOLDER_GRADES[gradeIndex++ % PLACEHOLDER_GRADES.length];

export default function MonitoringOnMass() {
  const [recordings, setRecordings] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
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
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {recordings.length} Recording{recordings.length > 1 ? "s" : ""}
            </h2>
          </div>

          {recordings.map((rec) => (
            <div key={rec.id} className="relative group">
              <RecordingRow recording={rec} onGradeOverride={handleGradeOverride} />
              {/* Remove button */}
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