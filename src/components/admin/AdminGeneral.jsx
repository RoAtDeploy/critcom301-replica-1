import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Users, Briefcase, Phone, ListChecks, ImagePlus, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import OptionList from "@/components/admin/OptionList";
import { base44 } from "@/api/base44Client";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function LogoUploader() {
  const [logoUrl, setLogoUrl] = useState(null);
  const [configId, setConfigId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    base44.entities.AdminConfig.filter({ key: "logo" }).then((records) => {
      if (records.length > 0) {
        setLogoUrl(records[0].values?.[0] || null);
        setConfigId(records[0].id);
      }
    });
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (configId) {
      await base44.entities.AdminConfig.update(configId, { values: [file_url] });
    } else {
      const record = await base44.entities.AdminConfig.create({ key: "logo", values: [file_url] });
      setConfigId(record.id);
    }
    setLogoUrl(file_url);
    setUploading(false);
  };

  const handleRemove = async () => {
    if (configId) await base44.entities.AdminConfig.update(configId, { values: [] });
    setLogoUrl(null);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-base">Organisation Logo</CardTitle>
        </div>
        <CardDescription>Displayed in the top bar of the application.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-12 max-w-[160px] object-contain rounded border border-border bg-muted/30 p-1" />
          ) : (
            <div className="h-12 w-32 rounded border border-dashed border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
              No logo set
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {uploading ? "Uploading…" : "Upload Logo"}
          </Button>
          {logoUrl && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleRemove}>
              <Trash2 className="w-4 h-4" /> Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminGeneral() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Role Options</CardTitle>
            <CardDescription>Roles available when adding a staff member.</CardDescription>
          </CardHeader>
          <CardContent>
            <OptionList type="roles" label="Role Options" icon={Briefcase} color="indigo" />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Department Options</CardTitle>
            <CardDescription>Departments available when adding a staff member.</CardDescription>
          </CardHeader>
          <CardContent>
            <OptionList type="departments" label="Department Options" icon={Building2} color="teal" />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Line Manager Options</CardTitle>
            <CardDescription>Line managers available when adding a staff member.</CardDescription>
          </CardHeader>
          <CardContent>
            <OptionList type="lineManagers" label="Line Manager Options" icon={Users} color="orange" />
          </CardContent>
        </Card>

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

      <motion.div variants={itemVariants}>
        <LogoUploader />
      </motion.div>

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
    </motion.div>
  );
}