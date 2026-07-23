import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileCheck2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["Safety", "Performance", "Communication", "General"];

export default function ResourceDialog({ resource, onSave, onClose }) {
  const [title, setTitle] = useState(resource?.title || "");
  const [type, setType] = useState(resource?.type || "document");
  const [fileUrl, setFileUrl] = useState(resource?.file_url || "");
  const [linkUrl, setLinkUrl] = useState(resource?.link_url || "");
  const [description, setDescription] = useState(resource?.description || "");
  const [category, setCategory] = useState(resource?.category || "General");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFileName(file.name);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      title,
      type,
      file_url: type === "web_link" ? null : fileUrl,
      link_url: type === "web_link" ? linkUrl : null,
      description,
      category,
    };
    await onSave(payload);
    setSaving(false);
  };

  const isValid = title && (type === "web_link" ? linkUrl : fileUrl);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{resource ? "Edit Resource" : "Add Resource"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Best Practice: Clear Communication" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="audio">Audio File</SelectItem>
                <SelectItem value="web_link">Web Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {type === "web_link" ? (
            <div>
              <Label>URL</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            </div>
          ) : (
            <div>
              <Label>File</Label>
              {fileUrl ? (
                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <FileCheck2 className="w-4 h-4 text-accent" />
                  <span className="text-sm text-muted-foreground flex-1 truncate">{fileName || "File uploaded"}</span>
                  <Button variant="outline" size="sm" onClick={() => { setFileUrl(""); setFileName(""); }}>Replace</Button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-6 cursor-pointer hover:bg-accent/50 transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span className="text-sm text-muted-foreground">{uploading ? "Uploading…" : "Click to upload"}</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept={type === "audio" ? "audio/*" : "*/*"} />
                </label>
              )}
            </div>
          )}
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief context for the staff member…" className="resize-none" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !isValid}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}