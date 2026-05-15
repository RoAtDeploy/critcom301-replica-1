import { Users, FileText, ListChecks } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentReports from "@/components/dashboard/RecentReports";
import RecentActions from "@/components/dashboard/RecentActions";
import AdminSummary from "@/components/dashboard/AdminSummary";
import CallTimeCard from "@/components/dashboard/CallTimeCard";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function Dashboard() {
  const [staffCount, setStaffCount] = useState(null);
  const [reportCount, setReportCount] = useState(null);
  const [openActions, setOpenActions] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.StaffMember.filter({ status: "active" }),
      base44.entities.Report.list(),
      base44.entities.Report.list(),
    ]).then(([staff, reports]) => {
      setStaffCount(staff.length);
      setReportCount(reports.length);
      // Count open (incomplete) action items across all reports
      const open = reports.reduce((sum, r) => {
        const items = r.action_items || [];
        return sum + items.filter(a => !a.completed).length;
      }, 0);
      setOpenActions(open);
    });
  }, []);

  const stats = [
    { title: "Total Staff", value: staffCount !== null ? String(staffCount) : "—", subtitle: "Active members", icon: Users, color: "indigo" },
    { title: "Reports Generated", value: reportCount !== null ? String(reportCount) : "—", subtitle: "All time", icon: FileText, color: "teal" },
    { title: "Open Actions", value: openActions !== null ? String(openActions) : "—", subtitle: "Across all staff", icon: ListChecks, color: "orange" },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor your team's call performance at a glance.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
        <CallTimeCard />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentReports />
        <RecentActions />
      </motion.div>

      <motion.div variants={itemVariants}>
        <AdminSummary />
      </motion.div>
    </motion.div>
  );
}