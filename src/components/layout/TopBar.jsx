import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

export default function TopBar() {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    base44.entities.AdminConfig.filter({ key: "logo" }).then((records) => {
      if (records.length > 0) setLogoUrl(records[0].values?.[0] || null);
    });
  }, []);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header className="h-[72px] border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
        )}
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        <div className="w-px h-8 bg-border" />
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">{user?.full_name || "—"}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{user?.role || "—"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}