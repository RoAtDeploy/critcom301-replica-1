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
import { useAdmin } from "@/context/AdminContext";

export default function GenerateReport() {
  const navigate = useNavigate();

  const prefilledStaffId = new URLSearchParams(window.location.search).get("staffId");
  const [dragOver, setDragOver] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(prefilledStaffId);
  const [selectedRole, setSelectedRole] = useState(null);
  const [callDate, setCallDate] = useState("");
  const [callType, setCallType] = useState(null);
  const [callContext, setCallContext] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcription, setTranscription] = useState(null);
  const [staffChannel, setStaffChannel] = useState(null); // 'LC' or 'RC'
  const [otherRole, setOtherRole] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const { staffList, roles: adminRoles } = useAdmin();
  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

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

  const [audioUrl, setAudioUrl] = useState(null);

  const handleTranscribe = async () => {
    if (!audioFile) return;
    setTranscribing(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
    setAudioUrl(file_url);
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
      otherRole,
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
      other_role: otherRole,
      staff_channel: staffChannel,
      audio_url: audioUrl,
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
            <Select value={selectedStaffId} onValueChange={(val) => { setSelectedStaffId(val); setSelectedRole(null); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((s) => (
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
                  <Button variant="ghost" size="icon" onClick={() => { setAudioFile(null); setTranscription(null); setStaffChannel(null); setOtherRole(null); }}>
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
                        <p className="text-sm font-semibold">Identify each channel</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Review the transcript and assign the staff member to their channel. Select the role of the other person on the call.</p>

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

                      {/* Two channel cards */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {['LC', 'RC'].map((ch) => {
                          const isStaffChannel = staffChannel === ch;
                          const isOtherChannel = staffChannel && staffChannel !== ch;
                          const isBlue = ch === 'LC';
                          return (
                            <div
                              key={ch}
                              className={`rounded-lg border-2 p-3 space-y-2 transition-all ${
                                isStaffChannel
                                  ? isBlue ? 'border-blue-500 bg-blue-50' : 'border-orange-500 bg-orange-50'
                                  : 'border-border bg-background'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                  isBlue ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {ch === 'LC' ? 'Left Channel' : 'Right Channel'}
                                </span>
                              </div>

                              {isStaffChannel ? (
                                /* Staff member label */
                                <div className="flex items-center gap-1.5 py-1">
                                  <User className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="text-sm font-semibold text-foreground truncate">
                                    {selectedStaff?.name || 'Staff Member'}
                                  </span>
                                </div>
                              ) : isOtherChannel ? (
                                /* Role selector for the other channel */
                                <Select value={otherRole} onValueChange={setOtherRole}>
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select their role…" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {adminRoles.map((r) => (
                                      <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                /* Prompt to assign */
                                <p className="text-xs text-muted-foreground py-1">Assign below</p>
                              )}

                              <button
                                type="button"
                                onClick={() => { setStaffChannel(ch); setOtherRole(null); }}
                                className={`w-full text-xs font-semibold py-1.5 rounded-md border transition-all ${
                                  isStaffChannel
                                    ? isBlue ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-orange-400 bg-orange-100 text-orange-700'
                                    : 'border-border hover:bg-muted text-muted-foreground'
                                }`}
                              >
                                {isStaffChannel ? '✓ Staff member' : 'Set as staff member'}
                              </button>
                            </div>
                          );
                        })}
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
              disabled={!transcription || !staffChannel || !otherRole || generatingReport}
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