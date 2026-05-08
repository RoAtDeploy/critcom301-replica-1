import { Users, FileText, ListChecks, TrendingUp, Settings2, ArrowRight } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import RecentReports from "@/components/dashboard/RecentReports";
import RecentActions from "@/components/dashboard/RecentActions";
import AdminSummary from "@/components/dashboard/AdminSummary";
import { motion } from "framer-motion";

const stats = [
  { title: "Total Staff", value: "24", subtitle: "Active members", icon: Users, trend: "+3", trendUp: true, color: "indigo" },
  { title: "Reports Generated", value: "156", subtitle: "This month", icon: FileText, trend: "12%", trendUp: true, color: "teal" },
  { title: "Open Actions", value: "18", subtitle: "Across all staff", icon: ListChecks, trend: "5", trendUp: false, color: "orange" },
  { title: "Avg. Score", value: "82%", subtitle: "Call quality", icon: TrendingUp, trend: "4%", trendUp: true, color: "rose" },
];

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