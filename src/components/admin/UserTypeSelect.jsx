import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown } from "lucide-react";

export const USER_TYPES = [
  { value: "admin", label: "Admin", className: "bg-primary/10 text-primary border-primary/20" },
  { value: "line_manager", label: "Line Manager", className: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
  { value: "assessor", label: "Assessor", className: "bg-muted text-muted-foreground border-border" },
];

export default function UserTypeSelect({ value = [], onChange, compact = false, placeholder = "Select user types…" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (type) => {
    const next = value.includes(type) ? value.filter((t) => t !== type) : [...value, type];
    onChange(next);
  };

  const selected = USER_TYPES.filter((t) => value.includes(t.value));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left hover:bg-muted/40 transition-colors ${
          compact ? "h-7 px-2 text-xs" : "h-9"
        }`}
      >
        {compact ? (
          <span className="text-muted-foreground">{selected.length} type{selected.length !== 1 ? "s" : ""}</span>
        ) : selected.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selected.map((t) => (
              <Badge key={t.value} variant="secondary" className={t.className}>
                {t.label}
              </Badge>
            ))}
          </div>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[180px] bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {USER_TYPES.map((t) => {
            const checked = value.includes(t.value);
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => toggle(t.value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-muted transition-colors ${
                  checked ? "bg-primary/5" : ""
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    checked ? "bg-primary border-primary" : "border-input"
                  }`}
                >
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {t.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}