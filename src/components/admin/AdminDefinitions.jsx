import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import DefinitionsManager from "@/components/admin/DefinitionsManager";

export default function AdminDefinitions() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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
  );
}