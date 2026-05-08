import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, FileAudio, User, Briefcase, Calendar, AlignLeft, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Report.get(id).then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return <div className="text-center py-20 text-muted-foreground">Report not found.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <Link
        to="/staff"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Staff
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Call Report</h1>
        <p className="text-muted-foreground mt-1">Full report details for this recorded call.</p>
      </div>

      {/* Summary */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Call Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow icon={User} label="Staff Member" value={report.staff_name || "—"} />
          <InfoRow icon={Briefcase} label="Role on Site" value={report.role || "—"} />
          <InfoRow icon={Calendar} label="Date of Call" value={report.call_date ? new Date(report.call_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
          <InfoRow icon={Phone} label="Call Type" value={report.call_type || "—"} />
          <InfoRow icon={Clock} label="Duration" value={report.transcription_duration ? `${Math.round(report.transcription_duration)}s` : "—"} />
          <InfoRow icon={FileAudio} label="Language" value={report.transcription_language || "—"} />
          {report.call_context && (
            <div className="sm:col-span-2">
              <InfoRow icon={AlignLeft} label="Context" value={report.call_context} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcription */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileAudio className="w-4 h-4 text-muted-foreground" />
            Transcription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.timestamped_transcript?.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {report.timestamped_transcript.map((line, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <span className="flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 rounded px-2 py-0.5 h-fit whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {line.timestamp}
                  </span>
                  {line.channel && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded h-fit whitespace-nowrap ${
                      line.channel === 'LC'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {line.channel}
                    </span>
                  )}
                  <p className="text-foreground leading-relaxed">{line.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">{report.transcription_text || "No transcription available."}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
        <p className="font-medium mt-0.5 text-sm">{value}</p>
      </div>
    </div>
  );
}