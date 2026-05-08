import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Users, Briefcase, Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import OptionList from "@/components/admin/OptionList";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Admin() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
            <p className="text-muted-foreground mt-0.5">Manage the dropdown options used across the app.</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Role Options</CardTitle>
            <CardDescription>Roles available when adding a staff member.</CardDescription>
          </CardHeader>
          <CardContent>
            <OptionList type="roles" label="Role Options" icon={Briefcase} color="indigo" />
          </CardContent>
        </Card>

        {/* Departments */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Department Options</CardTitle>
            <CardDescription>Departments available when adding a staff member.</CardDescription>
          </CardHeader>
          <CardContent>
            <OptionList type="departments" label="Department Options" icon={Building2} color="teal" />
          </CardContent>
        </Card>

        {/* Line Managers */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Line Manager Options</CardTitle>
            <CardDescription>Line managers available when adding a staff member.</CardDescription>
          </CardHeader>
          <CardContent>
            <OptionList type="lineManagers" label="Line Manager Options" icon={Users} color="orange" />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}