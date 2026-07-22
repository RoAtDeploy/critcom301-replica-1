import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchableStaffSelect({ staffMembers, value, onChange, placeholder = "Select staff" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () => [...staffMembers].sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [staffMembers]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((s) => (s.name || "").toLowerCase().includes(q));
  }, [sorted, query]);

  const selectedObj = value !== "unknown" ? staffMembers.find((s) => s.id === value) : null;
  const displayLabel = value === "unknown" ? "Unknown / Unassigned" : selectedObj?.name || placeholder;

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-8 text-xs w-44 inline-flex items-center justify-between gap-1 rounded-md border border-input bg-transparent px-2.5",
            "hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-ring"
          )}
        >
          <span className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{displayLabel}</span>
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search staff…" value={query} onValueChange={setQuery} />
          <CommandList>
            {filtered.length === 0 ? (
              <CommandEmpty>No staff found.</CommandEmpty>
            ) : (
              <CommandGroup>
                <CommandItem value="unknown" onSelect={() => handleSelect("unknown")}>
                  <Check className={cn("mr-1.5 h-3.5 w-3.5", value === "unknown" ? "opacity-100" : "opacity-0")} />
                  Unknown / Unassigned
                </CommandItem>
                {filtered.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.id}
                    onSelect={() => handleSelect(s.id)}
                  >
                    <Check className={cn("mr-1.5 h-3.5 w-3.5", value === s.id ? "opacity-100" : "opacity-0")} />
                    {s.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}