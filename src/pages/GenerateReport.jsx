import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, FileAudio, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

const mockStaff = [
  { id: "1", name: "Sarah Mitchell", roles: ["Senior Sales Rep", "Team Lead"] },
  { id: "2", name: "James Walker", roles: ["Sales Rep"] },
  { id: "3", name: "Emily Chen", roles: ["Customer Support", "Team Lead"] },
  { id: "4", name: "Marcus Johnson", roles: ["Sales Rep"] },
  { id: "5", name: "Olivia Brown", roles: ["Senior Sales Rep"] },
  { id: "6", name: "Daniel Kim", roles: ["Customer Support", "Manager"] },
];

export default function GenerateReport() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const selectedStaff = mockStaff.find((s) => s.id === selectedStaffId);

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
            <Select onValueChange={(val) => setSelectedStaffId(val)}>
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
            <Select disabled={!selectedStaff}>
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
            <Label>Upload Recording</Label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
              className={`
                border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
                ${dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
                }
              `}
            >
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Drag and drop your audio file here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse • MP3, WAV, M4A up to 100MB
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Call Context (Optional)</Label>
            <Textarea
              placeholder="Add any context about this call, e.g. 'Initial sales call with new enterprise lead' or 'Customer complaint follow-up'…"
              className="h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Call Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Call</SelectItem>
                  <SelectItem value="support">Support Call</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="demo">Product Demo</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Evaluation Focus</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select focus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall Performance</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="product_knowledge">Product Knowledge</SelectItem>
                  <SelectItem value="objection_handling">Objection Handling</SelectItem>
                  <SelectItem value="closing">Closing Technique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link to="/">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button className="bg-primary hover:bg-primary/90">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}