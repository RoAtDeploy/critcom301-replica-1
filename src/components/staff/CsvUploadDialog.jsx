import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, XCircle, AlertTriangle, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

function parseCsv(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  });
}

// Normalise CSV column names to entity field names
function mapRow(row) {
  return {
    name: row.name || `${row.firstname || row.first_name || ""} ${row.lastname || row.last_name || ""}`.trim(),
    firstName: row.firstname || row.first_name || "",
    lastName: row.lastname || row.last_name || "",
    email: row.email || "",
    sentinelId: row.sentinelid || row.sentinel_id || row.sentinelnumber || row.sentinel_number || "",
    phone: row.phone || row.phonenumber || row.phone_number || "",
    department: row.department || "",
    lineManager: row.linemanager || row.line_manager || "",
    roles: row.roles ? row.roles.split(";").map((r) => r.trim()).filter(Boolean) : [],
  };
}

export default function CsvUploadDialog({ open, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [results, setResults] = useState(null); // { created, duplicates, errors }
  const [importing, setImporting] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f || !f.name.endsWith(".csv")) return;
    setFile(f);
    setResults(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCsv(e.target.result).map(mapRow).filter((r) => r.name);
      setRows(parsed);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    setImporting(true);
    const existing = await base44.entities.StaffMember.list();
    const existingEmails = new Set(existing.map((s) => s.email?.toLowerCase()).filter(Boolean));
    const existingSentinels = new Set(existing.map((s) => s.sentinelId?.toLowerCase()).filter(Boolean));

    const created = [];
    const duplicates = [];
    const errors = [];

    for (const row of rows) {
      const emailDup = row.email && existingEmails.has(row.email.toLowerCase());
      const sentinelDup = row.sentinelId && existingSentinels.has(row.sentinelId.toLowerCase());

      if (emailDup || sentinelDup) {
        duplicates.push({ name: row.name, reason: emailDup ? `email (${row.email})` : `sentinel ID (${row.sentinelId})` });
        continue;
      }

      try {
        await base44.entities.StaffMember.create(row);
        created.push(row.name);
        if (row.email) existingEmails.add(row.email.toLowerCase());
        if (row.sentinelId) existingSentinels.add(row.sentinelId.toLowerCase());
      } catch {
        errors.push(row.name);
      }
    }

    setResults({ created, duplicates, errors });
    setImporting(false);
    if (created.length > 0) onImported();
  };

  const handleClose = () => {
    setFile(null);
    setRows([]);
    setResults(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Staff via CSV</DialogTitle>
          <DialogDescription>
            Import multiple staff members at once. Duplicates are detected by <strong>email</strong> or <strong>Sentinel ID</strong>.
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4">
            {/* Drop zone */}
            {!file ? (
              <label className="cursor-pointer block">
                <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                  className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/40 hover:bg-muted/30 transition-all"
                >
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Drag & drop your CSV here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                </div>
              </label>
            ) : (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{rows.length} staff member{rows.length !== 1 ? "s" : ""} found</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setFile(null); setRows([]); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Preview */}
            {rows.length > 0 && (
              <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">Name</th>
                      <th className="text-left px-3 py-2 font-semibold">Email</th>
                      <th className="text-left px-3 py-2 font-semibold">Sentinel ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-1.5">{r.name || "—"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{r.email || "—"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{r.sentinelId || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Expected columns: <code className="bg-muted px-1 rounded">name</code>, <code className="bg-muted px-1 rounded">email</code>, <code className="bg-muted px-1 rounded">sentinelId</code>, <code className="bg-muted px-1 rounded">roles</code> (semicolon-separated), <code className="bg-muted px-1 rounded">department</code>, <code className="bg-muted px-1 rounded">lineManager</code>, <code className="bg-muted px-1 rounded">phone</code>
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={rows.length === 0 || importing} className="bg-primary hover:bg-primary/90">
                {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing…</> : `Import ${rows.length} Record${rows.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {results.created.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-emerald-800"><strong>{results.created.length}</strong> staff member{results.created.length !== 1 ? "s" : ""} imported successfully.</p>
                </div>
              )}
              {results.duplicates.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <strong>{results.duplicates.length}</strong> duplicate{results.duplicates.length !== 1 ? "s" : ""} skipped:
                    <ul className="mt-1 space-y-0.5 list-disc list-inside">
                      {results.duplicates.map((d, i) => <li key={i}>{d.name} — matched on {d.reason}</li>)}
                    </ul>
                  </div>
                </div>
              )}
              {results.errors.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-800"><strong>{results.errors.length}</strong> record{results.errors.length !== 1 ? "s" : ""} failed to import.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}