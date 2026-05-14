import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Users, Briefcase, Settings2, Phone, BookOpen, ListChecks } from "lucide-react";
import { motion } from "framer-motion";
import OptionList from "@/components/admin/OptionList";
import DefinitionsManager from "@/components/admin/DefinitionsManager";

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

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Call Types */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Call Type Options</CardTitle>
            <CardDescription>Call types available when generating a report.</CardDescription>
          </CardHeader>
          <CardContent>
            <OptionList type="callTypes" label="Call Type Options" icon={Phone} color="violet" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Templates */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Action Templates</CardTitle>
            </div>
            <CardDescription>
              Predefined actions available when assigning remedial actions to C and D-graded assessment items in reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OptionList type="actionTemplates" label="Action Templates" icon={ListChecks} color="orange" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Industry Definitions */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Industry Definitions</CardTitle>
            </div>
            <CardDescription>
              Abbreviations and terms used by the AI when interpreting transcripts. Add, edit, or remove entries to ensure accurate assessment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DefinitionsManager />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}