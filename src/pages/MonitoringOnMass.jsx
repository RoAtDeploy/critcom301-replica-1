import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileAudio, X, Radio } from "lucide-react";
import { motion } from "framer-motion";

export default function MonitoringOnMass() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (incoming) => {
    const audioFiles = Array.from(incoming).filter((f) => f.type.startsWith("audio/") || f.name.match(/\.(mp3|wav|m4a|ogg|flac|aac)$/i));
    setFiles((prev) => [
      ...prev,
      ...audioFiles.map((f) => ({ file: f, name: f.name, size: f.size, id: crypto.randomUUID() })),
    ]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <p className="text-muted-foreground mt-1">Upload multiple recordings for bulk analysis.</p>
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

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {files.length} file{files.length > 1 ? "s" : ""} queued
              </p>
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-muted/30">
                  <FileAudio className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-sm flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatSize(f.size)}</span>
                  <button onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="pt-2">
                <Button disabled className="bg-primary hover:bg-primary/90 w-full sm:w-auto opacity-60 cursor-not-allowed">
                  <Upload className="w-4 h-4 mr-2" />
                  Process Recordings
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Processing configuration coming soon.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}