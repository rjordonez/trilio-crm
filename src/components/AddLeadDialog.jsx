import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ManualTab from "@/components/add-lead/ManualTab";

export default function AddLeadDialog({ open, onOpenChange, onLeadCreated, isMobile, referrers = [], onReferrerAdded }) {
  const [resetKey, setResetKey] = useState(0);

  const handleOpenChange = useCallback((newOpen) => {
    if (!newOpen) {
      setResetKey((k) => k + 1);
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  const handleLeadCreated = useCallback((lead, opts) => {
    onLeadCreated?.(lead, opts);
    handleOpenChange(false);
  }, [onLeadCreated, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent fullScreen={isMobile} className={isMobile ? "" : "max-w-2xl max-h-[85vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">Add New Lead</DialogTitle>
          <p className="text-xs text-muted-foreground">Enter lead details below.</p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <ManualTab key={resetKey} onLeadCreated={handleLeadCreated} referrers={referrers} onReferrerAdded={onReferrerAdded} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
