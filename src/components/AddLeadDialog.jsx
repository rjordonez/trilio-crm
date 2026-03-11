import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Play } from "lucide-react";
import ManualTab from "@/components/add-lead/ManualTab";
import RecordingTab from "@/components/add-lead/RecordingTab";
import DemoTab from "@/components/add-lead/DemoTab";

export default function AddLeadDialog({ open, onOpenChange, onLeadCreated, isMobile }) {
  const [tab, setTab] = useState("manual");
  const [resetKey, setResetKey] = useState(0);

  const handleOpenChange = useCallback((newOpen) => {
    if (!newOpen) {
      // Reset to manual tab and bump resetKey when closing
      setTab("manual");
      setResetKey((k) => k + 1);
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  const handleTabChange = useCallback((newTab) => {
    setTab(newTab);
    setResetKey((k) => k + 1);
  }, []);

  const handleLeadCreated = useCallback((lead, opts) => {
    onLeadCreated?.(lead, opts);
    handleOpenChange(false);
  }, [onLeadCreated, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent fullScreen={isMobile} className={isMobile ? "" : "max-w-2xl max-h-[85vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Add New Lead</DialogTitle>
          <p className="text-xs text-muted-foreground">Enter details manually, upload a recording, or try a demo.</p>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="recording" className="flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5" />
              From Recording
            </TabsTrigger>
            <TabsTrigger value="demo" className="flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5" />
              Try Demo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <ManualTab onLeadCreated={handleLeadCreated} />
          </TabsContent>

          <TabsContent value="recording" className="mt-4">
            <RecordingTab onLeadCreated={handleLeadCreated} resetKey={resetKey} />
          </TabsContent>

          <TabsContent value="demo" className="mt-4">
            <DemoTab onLeadCreated={handleLeadCreated} resetKey={resetKey} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
