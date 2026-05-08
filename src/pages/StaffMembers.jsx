import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Filter, FileText, Phone, TrendingUp, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { mockReports } from "@/lib/mockData";
import { useAdmin } from "@/context/AdminContext";

const getInitials = (name) => name.split(" ").map((n) => n[0]).join("");

const scoreColor = (score) => {
  if (score >= 85) return "text-accent";
  if (score >= 70) return "text-chart-3";
  return "text-destructive";
};

export default function StaffMembers() {
  const { staffList } = useAdmin();
  const [search, setSearch] = useState("");

  const filtered = staffList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const reportCount = (id) => mockReports.filter((r) => r.staffId === id).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Members</h1>
          <p className="text-muted-foreground mt-1">View and manage your team's performance.</p>
        </div>
        <Link to="/staff/new">
          <Button className="bg-primary hover:bg-primary/90">
            + Add Staff Member
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search staff members…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        {filtered.map((member) => (
          <Link key={member.id} to={`/staff/${member.id}`}>
            <Card className="border-border/50 hover:shadow-md transition-shadow duration-200 cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.roles.join(", ")}</p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{member.calls}</span>
                      <span className="text-muted-foreground">calls</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className={`font-bold ${scoreColor(member.avgScore)}`}>{member.avgScore}%</span>
                      <span className="text-muted-foreground">avg</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{reportCount(member.id)}</span>
                      <span className="text-muted-foreground">reports</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        member.status === "active"
                          ? "bg-accent/10 text-accent border-accent/20"
                          : "bg-chart-3/10 text-chart-3 border-chart-3/20"
                      }
                    >
                      {member.status === "active" ? "Active" : "Review"}
                    </Badge>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}