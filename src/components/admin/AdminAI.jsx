import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Radio, FileText } from "lucide-react";
import { motion } from "framer-motion";
import AlertTriggersManager from "@/components/admin/AlertTriggersManager";
import QuickGradeGuideline from "@/components/admin/QuickGradeGuideline";
import AssessmentRulesManager from "@/components/admin/AssessmentRulesManager";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function AdminAI() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <CardTitle className="text-base">Alert Triggers</CardTitle>
            </div>
            <CardDescription>
              Words or phrases that, when detected in a transcript, automatically flag the recording with a warning. Configure severity and category for each trigger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertTriggersManager />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-orange-500" />
              <CardTitle className="text-base">Quick Grade Guideline</CardTitle>
            </div>
            <CardDescription>
              Defines how the AI assigns an overall grade to recordings processed via Monitoring on Mass. Edit the text to influence grading logic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuickGradeGuideline />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <CardTitle className="text-base">Assessment Rules — Full Report Scoring</CardTitle>
            </div>
            <CardDescription>
              Define the grading criteria for each of the 10 communication aspects assessed in full reports. Customise what constitutes an A, B, C, or D grade per aspect.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssessmentRulesManager />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}