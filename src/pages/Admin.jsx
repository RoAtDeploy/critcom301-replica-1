import { Settings2, BrainCircuit, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import AdminGeneral from "@/components/admin/AdminGeneral";
import AdminDefinitions from "@/components/admin/AdminDefinitions";
import AdminAI from "@/components/admin/AdminAI";

const tabs = [
  { id: "general", label: "General Settings", icon: Settings2 },
  { id: "definitions", label: "Industry Definitions", icon: BookOpen },
  { id: "ai", label: "AI Calibration", icon: BrainCircuit },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Configure the application, AI behaviour, and reference data.</p>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === id
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "general" && <AdminGeneral />}
      {activeTab === "definitions" && <AdminDefinitions />}
      {activeTab === "ai" && <AdminAI />}
    </motion.div>
  );
}