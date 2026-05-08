import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, FileAudio, Sparkles, Loader2, CheckCircle2, X, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { mockStaff } from "@/lib/mockData";

export default function GenerateReport() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [callDate, setCallDate] = useState("");
  const [callType, setCallType] = useState(null);
  const [callContext, setCallContext] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcription, setTranscription] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState(null);

  const selectedStaff = mockStaff.find((s) => s.id === selectedStaffId);

  const handleFileSelect = (file) => {
    if (file && /\.(mp3|wav|m4a|webm|mp4|mpeg|mpga|oga|ogg|flac)$/i.test(file.name)) {
      setAudioFile(file);
      setTranscription(null);
      setReport(null);
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) return;
    setTranscribing(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
    const res = await base44.functions.invoke('transcribeAudio', { file_url });
    setTranscription(res.data);
    setTranscribing(false);
  };

  const handleGenerateReport = async () => {
    if (!transcription) return;
    setGeneratingReport(true);
    const res = await base44.functions.invoke('generateReport', {
      transcription,
      staffName: selectedStaff?.name,
      role: selectedRole,
      callType,
      callDate,
      context: callContext,
    });
    setReport(res.data.report);
    setGeneratingReport(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Generate Report</h1>
        <p className="text-muted-foreground mt-1">Upload a call recording to generate an AI-powered performance report.</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileAudio className="w-5 h-5 text-primary" />
            Call Recording
          </CardTitle>
          <CardDescription>Select a staff member and upload the recording file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Staff Member</Label>
            <Select onValueChange={(val) => { setSelectedStaffId(val); setSelectedRole(null); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {mockStaff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Role on Site
              {!selectedStaff && <span className="ml-2 text-xs text-muted-foreground font-normal">(select a staff member first)</span>}
            </Label>
            <Select disabled={!selectedStaff} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder={selectedStaff ? "Select role…" : "—"} />
              </SelectTrigger>
              <SelectContent>
                {selectedStaff?.roles.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date of Call</Label>
            <Input type="date" value={callDate} onChange={(e) => setCallDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Upload Recording</Label>
            {!audioFile ? (
              <label>
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,.webm,.mp4,.mpeg,.mpga,.oga,.ogg,.flac"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Drag and drop your audio file here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse • MP3, WAV, M4A up to 100MB</p>
                </div>
              </label>
            ) : (
              <div className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileAudio className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{audioFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { setAudioFile(null); setTranscription(null); setReport(null); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {!transcription && (
                  <Button onClick={handleTranscribe} disabled={transcribing} variant="outline" className="w-full">
                    {transcribing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Transcribing…</> : "Transcribe Audio"}
                  </Button>
                )}
                {transcription && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-accent font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Transcription complete • {Math.round(transcription.duration)}s duration
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{transcription.text}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Call Context (Optional)</Label>
            <Textarea
              placeholder="Add any context about this call…"
              className="h-24 resize-none"
              value={callContext}
              onChange={(e) => setCallContext(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Call Type</Label>
            <Select onValueChange={setCallType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sales Call">Sales Call</SelectItem>
                <SelectItem value="Support Call">Support Call</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
                <SelectItem value="Product Demo">Product Demo</SelectItem>
                <SelectItem value="Complaint">Complaint</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link to="/">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              onClick={handleGenerateReport}
              disabled={!transcription || generatingReport}
              className="bg-primary hover:bg-primary/90"
            >
              {generatingReport
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                : <><Sparkles className="w-4 h-4 mr-2" />Generate Report</>
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                Call Report
              </CardTitle>
              <CardDescription>
                {report.staffName} • {report.role} • {report.callDate} • {report.callType}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Duration: {Math.round(report.duration)}s</span>
                <span>Language: {report.language}</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3">Timestamped Transcript</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {report.timestampedTranscript.map((line, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <span className="flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 rounded px-2 py-0.5 h-fit whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {line.timestamp}
                      </span>
                      <p className="text-foreground leading-relaxed">{line.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}