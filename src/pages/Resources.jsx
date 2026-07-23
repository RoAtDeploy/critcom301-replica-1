import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Headphones, ExternalLink, Plus, Pencil, Trash2, Search, Library } from "lucide-react";
import ResourceDialog from "@/components/resources/ResourceDialog";

const TYPE_CONFIG = {
  document: { icon: FileText, color: "text-blue-600", bg: "bg-blue-50", label: "Document" },
  audio: { icon: Headphones, color: "text-purple-600", bg: "bg-purple-50", label: "Audio" },
  web_link: { icon: ExternalLink, color: "text-accent", bg: "bg-accent/10", label: "Web Link" },
};

const CATEGORIES = ["Safety", "Performance", "Communication", "General"];

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchResources = async () => {
    const data = await base44.entities.Resource.list();
    setResources(data);
    setLoading(false);
  };

  useEffect(() => { fetchResources(); }, []);

  const handleSave = async (payload) => {
    if (editing) {
      await base44.entities.Resource.update(editing.id, payload);
    } else {
      await base44.entities.Resource.create(payload);
    }
    setDialogOpen(false);
    setEditing(null);
    fetchResources();
  };

  const handleDelete = async (id) => {
    await base44.entities.Resource.delete(id);
    fetchResources();
  };

  const filtered = resources.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
    const matchCategory = categoryFilter === "all" || r.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Library className="w-6 h-6 text-primary" />
            Resources
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage training materials and best-practice resources for assessment feedback.</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources…" className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Library className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No resources yet. Click "Add Resource" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => {
            const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.document;
            const url = r.type === "web_link" ? r.link_url : r.file_url;
            return (
              <Card key={r.id} className="flex flex-col">
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{r.title}</p>
                      <span className="text-xs text-muted-foreground">{cfg.label}</span>
                    </div>
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-3 line-clamp-3">{r.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-auto">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{r.category}</span>
                    <div className="flex-1" />
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">View</Button>
                      </a>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setDialogOpen(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {dialogOpen && (
        <ResourceDialog
          resource={editing}
          onSave={handleSave}
          onClose={() => { setDialogOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}