import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, FileAudio, Sparkles, Loader2, CheckCircle2, X, Clock, User } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { mockStaff } from "@/lib/mockData";

export default function GenerateReport() {
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [callDate, setCallDate] = useState("");
  const [callType, setCallType] = useState(null);
  const [callContext, setCallContext] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcription, setTranscription] = useState(null);
  const [staffChannel, setStaffChannel] = useState(null); // 'LC' or 'RC'
  const [generatingReport, setGeneratingReport] = useState(false);

  const selectedStaff = mockStaff.find((s) => s.id === selectedStaffId);

  const handleFileSelect = (file) => {
    if (file && /\.(mp3|wav|m4a|webm|mp4|mpeg|mpga|oga|ogg|flac)$/i.test(file.name)) {
      setAudioFile(file);
      setTranscription(null);
      setStaffChannel(null);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Build a preview of the first few alternating segments for channel identification
  const channelPreview = transcription?.segments?.slice(0, 6).map((seg, idx) => ({
    timestamp: formatTime(seg.start),
    channel: idx % 2 === 0 ? 'LC' : 'RC',
    text: seg.text.trim(),
  })) || [];

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
      staffChannel,
    });
    const reportData = res.data.report;
    const saved = await base44.entities.Report.create({
      staff_id: selectedStaffId,
      staff_name: selectedStaff?.name,
      role: selectedRole,
      call_date: callDate,
      call_type: callType,
      call_context: callContext,
      transcription_text: transcription.text,
      transcription_duration: transcription.duration,
      transcription_language: transcription.language,
      timestamped_transcript: reportData.timestampedTranscript || [],
    });
    setGeneratingReport(false);
    navigate(`/reports/${saved.id}`);
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
                  <Button variant="ghost" size="icon" onClick={() => { setAudioFile(null); setTranscription(null); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {!transcription && (
                  <Button onClick={handleTranscribe} disabled={transcribing} variant="outline" className="w-full">
                    {transcribing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Transcribing…</> : "Transcribe Audio"}
                  </Button>
                )}
                {transcription && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-accent font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Transcription complete • {Math.round(transcription.duration)}s duration
                    </div>

                    {/* Channel identification step */}
                    <div className="border rounded-xl p-4 space-y-3 bg-muted/20">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <p className="text-sm font-semibold">Which channel is the staff member?</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Review the conversation below and select which channel belongs to the staff member.</p>

                      {/* Preview transcript */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {channelPreview.map((line, idx) => (
                          <div key={idx} className="flex gap-2 text-sm items-start">
                            <span className="text-xs font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5 whitespace-nowrap">
                              {line.timestamp}
                            </span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                              line.channel === 'LC' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {line.channel}
                            </span>
                            <p className="text-muted-foreground leading-relaxed">{line.text}</p>
                          </div>
                        ))}
                      </div>

                      {/* Channel selection buttons */}
                      <div className="flex gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setStaffChannel('LC')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                            staffChannel === 'LC'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-border hover:border-blue-300 text-muted-foreground'
                          }`}
                        >
                          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded">LC</span>
                          Left Channel is staff
                        </button>
                        <button
                          type="button"
                          onClick={() => setStaffChannel('RC')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                            staffChannel === 'RC'
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-border hover:border-orange-300 text-muted-foreground'
                          }`}
                        >
                          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-1.5 py-0.5 rounded">RC</span>
                          Right Channel is staff
                        </button>
                      </div>
                    </div>
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
              disabled={!transcription || !staffChannel || generatingReport}
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


    </motion.div>
  );
}