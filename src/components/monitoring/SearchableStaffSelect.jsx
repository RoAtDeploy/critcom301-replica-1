import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

export default function SearchableStaffSelect({ staffMembers, value, onChange, placeholder = "Select staff" }) {
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () => [...staffMembers].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [staffMembers]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((s) =>
      `${s.name || ""} ${s.email || ""} ${s.lastName || ""}`.toLowerCase().includes(q)
    );
  }, [sorted, query]);

  const selectedObj = value !== "unknown" ? staffMembers.find((s) => s.id === value) : null;
  const displayLabel = value === "unknown" ? "Unknown / Unassigned" : selectedObj?.name || placeholder;

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        onChange(v);
        setQuery("");
      }}
    >
      <SelectTrigger className="h-8 text-xs w-44">
        <SelectValue>{displayLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="p-2 border-b border-border sticky top-0 bg-popover z-10">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search staff…"
              className="w-full pl-7 pr-7 py-1.5 text-xs rounded-md border border-input bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === " ") e.stopPropagation();
              }}
            />
            {query && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setQuery(""); }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 px-0.5">
            {filtered.length} of {sorted.length}
          </p>
        </div>
        <SelectItem value="unknown">Unknown / Unassigned</SelectItem>
        {filtered.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
        {filtered.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">No staff found</div>
        )}
      </SelectContent>
    </Select>
  );
}