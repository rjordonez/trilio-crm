import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { updateLead, deleteLead } from "@/services/supabaseLeads";
import { updateReferrer } from "@/services/supabaseReferrers";
import { createActivityLog } from "@/services/supabaseActivityLogs";
import { useAuth } from "@/contexts/AuthContext";
import TopBar from "@/components/TopBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { User, Calendar, Heart, LayoutGrid, Table as TableIcon, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, X, Phone, Mail, StickyNote, ArrowRightLeft, Check, Trash2, XCircle, Eye, EyeOff, Search, CheckSquare, Square, Link2 } from "lucide-react";
import { useNavigation } from "@/contexts/NavigationContext";
// import { Columns3 } from "lucide-react";
// import { useColumnConfig, BUILT_IN_COLUMNS } from "@/hooks/useColumnConfig";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import LeadDetailDialog from "@/components/LeadDetailDialog";
import AddLeadDialog from "@/components/AddLeadDialog";
import ImportCSVDialog from "@/components/ImportCSVDialog";
import CallDialog from "@/components/CallDialog";
import EmailComposeDialog from "@/components/EmailComposeDialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { defaultTemplates, personalizeContent } from "@/data/emailTemplates";

// stages, stageLabel, stageProgress are now passed as props from CRMView

const careLevelColors = {
  "Assisted Living": "bg-success/10 text-success",
  "Independent Living": "bg-info/10 text-info",
  "Memory Care": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Skilled Nursing": "bg-warning/10 text-warning",
};

const scoreColors = {
  hot: "bg-destructive/15 text-destructive",
  warm: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  cold: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  nurture: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const sourceOptions = ["Digital Ads", "Website", "Phone Call", "Walk-in", "Referral", "Event"];
const careOptions = ["Assisted Living", "Independent Living", "Memory Care", "Skilled Nursing"];
const scoreOptions = ["cold", "hot", "nurture", "warm"];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function daysAgoText(dateStr) {
  if (!dateStr) return "—";
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 60) return "1 month ago";
  return `${Math.floor(diffDays / 30)} months ago`;
}

function HeaderFilter({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const sortedOptions = useMemo(() => [...options].sort((a, b) => a.localeCompare(b)), [options]);

  useEffect(() => {
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isFiltered = value !== "all";

  const getDropdownPosition = () => {
    if (!triggerRef.current) return {};
    const rect = triggerRef.current.getBoundingClientRect();
    return {
      position: "fixed",
      top: rect.bottom + 4,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 180)),
    };
  };

  return (
    <div className="inline-flex items-center gap-1 cursor-pointer select-none">
      <div ref={triggerRef} className="inline-flex items-center gap-1" onClick={() => setOpen(!open)}>
        <span className={`whitespace-nowrap ${isFiltered ? "text-primary font-semibold" : ""}`}>{label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""} ${isFiltered ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      {isFiltered && (
        <button onClick={(e) => { e.stopPropagation(); onChange("all"); }} className="ml-0.5 rounded-full p-0.5 hover:bg-muted">
          <X className="h-2.5 w-2.5 text-primary" />
        </button>
      )}
      {open && (
        <div ref={dropdownRef} style={getDropdownPosition()} className="z-50 rounded-md border border-border bg-popover shadow-lg py-1 min-w-[160px] max-h-[60vh] overflow-y-auto flex flex-col">
          <button
            onClick={(e) => { e.stopPropagation(); onChange("all"); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${value === "all" ? "font-semibold text-primary" : "text-foreground"}`}
          >All</button>
          {sortedOptions.map((opt) => (
            <button
              key={opt}
              onClick={(e) => { e.stopPropagation(); onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${value === opt ? "font-semibold text-primary" : "text-foreground"}`}
            >{opt}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function SortIcon({ sortKey: sk, sortDir: sd, columnKey }) {
  if (sk !== columnKey) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />;
  return sd === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
}

function StageChangeModal({ lead, open, onOpenChange, onStageChange, isMobile }) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (!lead) return null;

  const handleReject = () => {
    onStageChange(lead.id, "rejected", rejectReason || undefined);
    setShowRejectReason(false);
    setRejectReason("");
    onOpenChange(false);
  };

  const handleClose = (val) => {
    if (!val) {
      setShowRejectReason(false);
      setRejectReason("");
    }
    onOpenChange(val);
  };

  const stageList = (
    <div className="space-y-1 p-4">
      {stages.map((stage) => (
        <button
          key={stage.key}
          onClick={() => {
            onStageChange(lead.id, stage.key);
            handleClose(false);
          }}
          className={`w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            lead.stage === stage.key
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-foreground"
          }`}
        >
          <span>{stage.label}</span>
          {lead.stage === stage.key && <Check className="h-4 w-4" />}
        </button>
      ))}

      <div className="border-t border-border mt-2 pt-2">
        {!showRejectReason ? (
          <button
            onClick={() => setShowRejectReason(true)}
            className={`w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              lead.stage === "rejected"
                ? "bg-destructive text-destructive-foreground"
                : "hover:bg-destructive/10 text-destructive"
            }`}
          >
            <span className="flex items-center gap-2"><XCircle className="h-4 w-4" /> Reject</span>
            {lead.stage === "rejected" && <Check className="h-4 w-4" />}
          </button>
        ) : (
          <div className="space-y-2 px-1">
            <p className="text-sm font-medium text-destructive">Reason for rejection (optional)</p>
            <Textarea
              placeholder="e.g. Budget too low, not ready to move..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-sm min-h-[60px]"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" className="flex-1" onClick={handleReject}>
                Reject
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowRejectReason(false); setRejectReason(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Move {lead.name}</DrawerTitle>
          </DrawerHeader>
          {stageList}
          <div className="p-4 pt-0">
            <Button variant="outline" className="w-full" onClick={() => handleClose(false)}>
              Cancel
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Move {lead.name}</DialogTitle>
        </DialogHeader>
        {stageList}
      </DialogContent>
    </Dialog>
  );
}

/* COMMENTED OUT - ColumnToggle component
function ColumnToggle({ allColumns, visibleIds, onToggle, onReset }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors bg-muted text-muted-foreground hover:bg-muted/80`}
      >
        <Columns3 className="h-3.5 w-3.5" /> Columns
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 rounded-md border border-border bg-popover shadow-lg py-1 min-w-[200px] max-h-[60vh] overflow-y-auto">
          {allColumns.map((col) => (
            <label
              key={col.id}
              className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visibleIds.includes(col.id)}
                disabled={col.alwaysVisible}
                onChange={() => onToggle(col.id)}
                className="rounded border-border"
              />
              <span className={col.alwaysVisible ? "text-muted-foreground" : "text-foreground"}>{col.label}</span>
              {col.isCustom && <span className="text-[10px] text-muted-foreground">(custom)</span>}
            </label>
          ))}
          <div className="border-t border-border mt-1 pt-1 px-3 py-1">
            <button onClick={onReset} className="text-[10px] text-primary hover:underline">Reset to default</button>
          </div>
        </div>
      )}
    </div>
  );
}
*/

function AddStageColumn({ onAddStage }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddStage?.(name.trim());
    setName("");
    setAdding(false);
  };

  if (adding) {
    return (
      <div className="w-64 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Input
            autoFocus
            placeholder="Stage name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setName(""); } }}
            className="h-7 text-xs"
          />
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handleAdd} disabled={!name.trim()}>Add</Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setAdding(false); setName(""); }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-16 flex-shrink-0 flex items-start justify-center pt-0.5">
      <button
        onClick={() => setAdding(true)}
        className="flex items-center justify-center h-7 w-7 rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
        title="Add stage"
      >
        <span className="text-lg leading-none">+</span>
      </button>
    </div>
  );
}

export default function LeadsPage({ leads, setLeads, onAddLead, autoOpenLeadId, onAutoOpenHandled, referrers = [], setReferrers, onReferrerAdded, alerts = [], tasks = [], onAddTask, onUpdateTask, onDeleteTask, customFields = [], orgSettings, saveOrgSettings, stages = [], stageLabel = {}, stageProgress = {}, onAddStage, executeRules }) {
  const { user, organization, gmailConnected } = useAuth();
  const { navigate } = useNavigation();
  const userName = user?.user_metadata?.full_name || user?.email || "System";
  const orgId = organization?.id;
  const autoRejectEmailEnabled = orgId ? (localStorage.getItem(`auto_reject_email_${orgId}`) ?? "true") === "true" : true;
  /* COMMENTED OUT - useColumnConfig hook
  const { allColumns, visibleColumns, visibleIds, toggleColumn, resetToDefaults } = useColumnConfig(
    orgSettings?.column_config || null,
    customFields,
    (ids) => saveOrgSettings?.({ column_config: ids })
  );
  */
  const isMobile = useIsMobile();
  const [view, setView] = useState("table");
  const [selectedLead, setSelectedLead] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filters, setFilters] = useState({ stage: "all", source: "all", careLevel: "all", salesRep: "all", score: "all" });
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (key) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else { setSortKey(null); setSortDir("asc"); }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
  const [stageChangeLead, setStageChangeLead] = useState(null);
  const [kanbanCareFilter, setKanbanCareFilter] = useState("all");
  const [showRejected, setShowRejected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Call & Email dialog state
  const [callTarget, setCallTarget] = useState(null);
  const [emailTarget, setEmailTarget] = useState(null);

  // Bulk selection
  const [selectMode, setSelectMode] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());

  // Bulk email compose
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [bulkEmailTemplate, setBulkEmailTemplate] = useState("");
  const [bulkEmailSubject, setBulkEmailSubject] = useState("");
  const [bulkEmailBody, setBulkEmailBody] = useState("");
  const [bulkEmailSending, setBulkEmailSending] = useState(false);
  const [bulkEmailProgress, setBulkEmailProgress] = useState("");

  // Gmail not connected popup
  const [showGmailPrompt, setShowGmailPrompt] = useState(false);

  // Auto-open lead detail dialog when autoOpenLeadId is set
  useEffect(() => {
    if (autoOpenLeadId) {
      const lead = leads.find((l) => l.id === autoOpenLeadId);
      if (lead) {
        setSelectedLead(lead);
        onAutoOpenHandled?.();
      }
    }
  }, [autoOpenLeadId, leads, onAutoOpenHandled]);

  const salesRepOptions = useMemo(() => [...new Set(leads.map((l) => l.salesRep))], [leads]);

  const filteredLeads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = leads.filter((l) => {
      if (filters.stage !== "all" && l.stage !== filters.stage) return false;
      if (filters.source !== "all" && l.source !== filters.source) return false;
      if (filters.careLevel !== "all" && l.careLevel !== filters.careLevel) return false;
      if (filters.salesRep !== "all" && l.salesRep !== filters.salesRep) return false;
      if (filters.score !== "all" && l.score !== filters.score) return false;
      if (q) {
        const searchable = [l.name, l.contactPerson, l.contactPhone, l.contactEmail, l.careLevel, l.source, l.salesRep, l.referredBy, l.referPartner].filter(Boolean).join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
    if (!sortKey) return filtered;
    const mul = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let va = a[sortKey] || "";
      let vb = b[sortKey] || "";
      // Date columns
      if (sortKey === "inquiryDate" || sortKey === "lastContactDate") {
        return mul * (new Date(va || 0) - new Date(vb || 0));
      }
      // String compare
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      return mul * va.localeCompare(vb);
    });
  }, [leads, filters, searchQuery, sortKey, sortDir]);

  const kanbanLeads = useMemo(() => filteredLeads.filter((l) => l.stage !== "rejected"), [filteredLeads]);
  const rejectedLeads = useMemo(() => filteredLeads.filter((l) => l.stage === "rejected"), [filteredLeads]);

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;
    if (sourceStage === destStage && source.index === destination.index) return;
    const sourceItems = leads.filter((l) => l.stage === sourceStage);
    const moved = { ...sourceItems[source.index], stage: destStage };
    const withoutMoved = leads.filter((l) => l.id !== moved.id);
    const destItems = withoutMoved.filter((l) => l.stage === destStage);
    destItems.splice(destination.index, 0, moved);
    const otherLeads = withoutMoved.filter((l) => l.stage !== destStage);
    setLeads([...otherLeads, ...destItems]);
    updateLead(moved.id, moved).catch(console.error);
    if (sourceStage !== destStage) {
      createActivityLog({
        leadId: moved.id,
        type: "note",
        title: "Stage Changed",
        description: `${stageLabel[sourceStage] || sourceStage} → ${stageLabel[destStage] || destStage}`,
        by: userName,
        date: new Date().toISOString().split("T")[0],
      }, orgId).catch((err) => console.error("Failed to save activity log:", err));
    }
  }, [leads, setLeads, userName, orgId]);

  const handleStageChange = useCallback((leadId, newStage, rejectReason) => {
    let oldStage = "";
    let rejectedLead = null;
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          oldStage = l.stage;
          const updated = { ...l, stage: newStage };
          if (newStage === "rejected") {
            updated.rejectedReason = rejectReason || "";
            updated.rejectedDate = new Date().toISOString().split("T")[0];
            rejectedLead = updated;
          }
          updateLead(leadId, updated).catch(console.error);
          return updated;
        }
        return l;
      })
    );
    const dateStr = new Date().toISOString().split("T")[0];
    const oldLabel = stageLabel[oldStage] || oldStage;
    const newLabel = stageLabel[newStage] || newStage;
    if (newStage === "rejected") {
      createActivityLog({
        leadId,
        type: "note",
        title: "Lead Rejected",
        description: rejectReason || "No reason provided",
        by: userName,
        date: dateStr,
      }, orgId).catch((err) => console.error("Failed to save activity log:", err));

      // Prompt user to send rejection email (if enabled in settings)
      if (autoRejectEmailEnabled && rejectedLead?.contactEmail) {
        if (gmailConnected) {
          setPendingRejectionEmail({ lead: rejectedLead, leadId, dateStr });
        } else {
          setShowGmailPrompt(true);
        }
      }
    } else {
      createActivityLog({
        leadId,
        type: "note",
        title: "Stage Changed",
        description: `${oldLabel} → ${newLabel}`,
        by: userName,
        date: dateStr,
      }, orgId).catch((err) => console.error("Failed to save activity log:", err));

      // Auto-create tasks from automation rules for the new stage
      if (executeRules) {
        const lead = leads.find((l) => l.id === leadId);
        const autoTasks = executeRules(newStage, lead, newLabel);
        for (const task of autoTasks) {
          onAddTask?.(task);
        }
      }
    }
  }, [setLeads, userName, gmailConnected, orgId, executeRules, leads, onAddTask, autoRejectEmailEnabled, stageLabel]);

  // Pending rejection email approval with preview
  const [pendingRejectionEmail, setPendingRejectionEmail] = useState(null);
  const [rejectionEmailSubject, setRejectionEmailSubject] = useState("");
  const [rejectionEmailBody, setRejectionEmailBody] = useState("");
  const [rejectionEmailSending, setRejectionEmailSending] = useState(false);

  // When pendingRejectionEmail is set, pre-fill from saved template or default
  useEffect(() => {
    if (pendingRejectionEmail) {
      const defaultTemplate = defaultTemplates.find((t) => t.id === "t6");
      let subject = defaultTemplate?.subject || "";
      let body = defaultTemplate?.body || "";
      // Check for user-customized template in localStorage
      if (orgId) {
        try {
          const saved = JSON.parse(localStorage.getItem(`rejection_template_${orgId}`));
          if (saved) {
            subject = saved.subject;
            body = saved.body;
          }
        } catch {}
      }
      setRejectionEmailSubject(personalizeContent(subject, pendingRejectionEmail.lead, userName));
      setRejectionEmailBody(personalizeContent(body, pendingRejectionEmail.lead, userName));
    }
  }, [pendingRejectionEmail, orgId, userName]);

  const sendRejectionEmail = useCallback(async () => {
    if (!pendingRejectionEmail || !rejectionEmailSubject.trim() || !rejectionEmailBody.trim()) return;
    const { lead, leadId, dateStr } = pendingRejectionEmail;
    setRejectionEmailSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/gmail-send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ to: lead.contactEmail, subject: rejectionEmailSubject, body: rejectionEmailBody }),
      });
      if (res.ok) {
        toast({ title: "Rejection email sent", description: `Email sent to ${lead.contactEmail}` });
        createActivityLog({ leadId, type: "email", title: "Auto: Rejection Notice", description: `Rejection email sent to ${lead.contactEmail}`, by: userName, date: dateStr }, orgId).catch(console.error);
      } else {
        toast({ title: "Send failed", description: "Could not send rejection email", variant: "destructive" });
      }
    } catch {
      toast({ title: "Send failed", description: "Could not send rejection email", variant: "destructive" });
    }
    setRejectionEmailSending(false);
    setPendingRejectionEmail(null);
  }, [pendingRejectionEmail, rejectionEmailSubject, rejectionEmailBody, userName, orgId]);

  // Reject lead from kanban trash icon
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Delete lead
  const [deleteTarget, setDeleteTarget] = useState(null);
  const handleDeleteLead = async (lead) => {
    try {
      // If lead has a referrer, remove lead from referrer's referredLeadIds
      if (lead.referrerId) {
        const referrer = referrers.find(r => r.id === lead.referrerId);
        if (referrer) {
          const updatedIds = (referrer.referredLeadIds || []).filter(id => id !== lead.id);
          await updateReferrer(referrer.id, { ...referrer, referredLeadIds: updatedIds });
          setReferrers(prev => prev.map(r => r.id === referrer.id ? { ...r, referredLeadIds: updatedIds } : r));
        }
      }
      await deleteLead(lead.id);
      setLeads(prev => prev.filter(l => l.id !== lead.id));
      setDeleteTarget(null);
      setSelectedLead(null);
      toast({ title: "Lead deleted", description: `${lead.name} has been permanently deleted.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete lead", variant: "destructive" });
    }
  };

  const handleCall = (lead) => {
    setCallTarget({ name: lead.name, phone: lead.contactPhone });
  };

  const handleEmail = (lead) => {
    setEmailTarget(lead);
  };

  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      if (prev) setSelectedLeadIds(new Set());
      return !prev;
    });
  }, []);

  const toggleLeadSelection = useCallback((leadId) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedLeadIds((prev) => {
      if (prev.size === filteredLeads.length) return new Set();
      return new Set(filteredLeads.map((l) => l.id));
    });
  }, [filteredLeads]);

  const clearSelection = useCallback(() => {
    setSelectedLeadIds(new Set());
  }, []);

  const selectedLeads = useMemo(() => leads.filter((l) => selectedLeadIds.has(l.id)), [leads, selectedLeadIds]);
  const emailableLeads = useMemo(() => selectedLeads.filter((l) => l.contactEmail), [selectedLeads]);

  const handleBulkEmailOpen = useCallback(() => {
    if (!gmailConnected) {
      setShowGmailPrompt(true);
      return;
    }
    if (emailableLeads.length === 0) {
      toast({ title: "No email addresses", description: "None of the selected leads have email addresses.", variant: "destructive" });
      return;
    }
    setBulkEmailOpen(true);
  }, [gmailConnected, emailableLeads]);

  const handleBulkTemplateChange = useCallback((templateId) => {
    setBulkEmailTemplate(templateId);
    if (!templateId) {
      setBulkEmailSubject("");
      setBulkEmailBody("");
      return;
    }
    const template = defaultTemplates.find((t) => t.id === templateId);
    if (template) {
      // Strip merge tags for bulk — these are group emails, not personalized
      const strip = (text) => text
        .replace(/\{\{name\}\}/g, "")
        .replace(/\{\{contact_person\}\}/g, "")
        .replace(/\{\{care_level\}\}/g, "")
        .replace(/\{\{sender_name\}\}/g, userName || "")
        .replace(/\s{2,}/g, " ")
        .trim();
      setBulkEmailSubject(strip(template.subject));
      setBulkEmailBody(template.body.replace(/\{\{sender_name\}\}/g, userName || "").replace(/\{\{name\}\}/g, "").replace(/\{\{contact_person\}\}/g, "").replace(/\{\{care_level\}\}/g, ""));
    }
  }, [userName]);

  const handleBulkEmailSend = useCallback(async () => {
    if (!bulkEmailSubject.trim() || !bulkEmailBody.trim() || emailableLeads.length === 0) return;
    setBulkEmailSending(true);
    let sent = 0;
    let failed = 0;
    const dateStr = new Date().toISOString().split("T")[0];
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      for (let i = 0; i < emailableLeads.length; i++) {
        const lead = emailableLeads[i];
        setBulkEmailProgress(`Sending ${i + 1}/${emailableLeads.length}...`);
        const subject = bulkEmailSubject.trim();
        const body = bulkEmailBody.trim();
        try {
          const res = await fetch("/api/gmail-send", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ to: lead.contactEmail, subject, body }),
          });
          if (res.ok) {
            sent++;
            createActivityLog({ leadId: lead.id, type: "email", title: "Bulk Email Sent", description: `Email sent: ${subject}`, by: userName, date: dateStr }, orgId).catch(console.error);
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }
    } finally {
      setBulkEmailSending(false);
      setBulkEmailProgress("");
      setBulkEmailOpen(false);
      setBulkEmailSubject("");
      setBulkEmailBody("");
      setBulkEmailTemplate("");
      setSelectedLeadIds(new Set());
      setSelectMode(false);
      toast({
        title: `${sent} email${sent !== 1 ? "s" : ""} sent`,
        description: failed > 0 ? `${failed} failed to send` : undefined,
        variant: failed > 0 ? "destructive" : undefined,
      });
    }
  }, [bulkEmailSubject, bulkEmailBody, emailableLeads, userName, orgId]);

  // --- Mobile Kanban ---
  const renderMobileKanban = () => (
    <div className="space-y-4">
      {stages.map((stage) => {
        const stageLeads = kanbanLeads.filter((l) => l.stage === stage.key);
        return (
          <div key={stage.key}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">{stage.label}</h3>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">{stageLeads.length}</span>
            </div>
            <div className="space-y-2">
              {stageLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-lg border border-border bg-card p-3 shadow-crm-sm"
                >
                  <div className="flex items-center justify-between">
                    <p
                      className="text-sm font-semibold text-foreground cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      {lead.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setRejectTarget(lead)}
                            className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom"><p>Reject</p></TooltipContent>
                      </Tooltip>
                      <button
                        onClick={() => setStageChangeLead(lead)}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Heart className="h-3 w-3 text-muted-foreground" />
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${careLevelColors[lead.careLevel]}`}>{lead.careLevel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{daysAgoText(lead.lastContactDate)}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium capitalize ${scoreColors[lead.score] || ""}`}>{lead.score}</span>
                    </div>
                  </div>
                </div>
              ))}
              {stageLeads.length === 0 && (
                <div className="rounded-lg bg-muted/30 p-4 text-center text-xs text-muted-foreground">No leads</div>
              )}
            </div>
          </div>
        );
      })}
      {rejectedLeads.length > 0 && (
        <div>
          <button
            onClick={() => setShowRejected(!showRejected)}
            className="flex items-center gap-2 mb-2 px-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {showRejected ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span className="uppercase tracking-wide">Rejections</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-[10px] font-medium text-destructive">{rejectedLeads.length}</span>
          </button>
          {showRejected && (
            <div className="space-y-2">
              {rejectedLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="rounded-lg border border-destructive/20 bg-card p-3 shadow-crm-sm cursor-pointer opacity-70 active:opacity-100 transition-all"
                >
                  <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Heart className="h-3 w-3 text-muted-foreground" />
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${careLevelColors[lead.careLevel]}`}>{lead.careLevel}</span>
                    </div>
                    {lead.rejectedReason && (
                      <p className="text-[10px] text-muted-foreground truncate">Reason: {lead.rejectedReason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // --- Mobile Table (card list) ---
  const renderMobileTable = () => (
    <div className="space-y-2">
      {filteredLeads.map((lead) => (
        <div
          key={lead.id}
          onClick={() => setSelectedLead(lead)}
          className={`rounded-lg border border-border bg-card p-3 shadow-crm-sm cursor-pointer active:bg-muted/50 transition-colors ${lead.stage === "rejected" ? "opacity-60" : ""}`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground">{lead.name}</p>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${careLevelColors[lead.careLevel]}`}>{lead.careLevel}</span>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            {lead.stage === "rejected" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive">Rejected</span>
            ) : (
              <>
                <Progress value={stageProgress[lead.stage]} className="h-2 flex-1" />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{stageLabel[lead.stage]}</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{lead.source}</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium capitalize ${scoreColors[lead.score] || ""}`}>{lead.score}</span>
            <span>{daysAgoText(lead.lastContactDate)}</span>
          </div>
        </div>
      ))}
    </div>
  );

  /* COMMENTED OUT - renderCell function (replaced with hardcoded columns)
  function renderCell(col, lead) {
    switch (col.renderType) {
      case "name":
        return <span className="font-medium text-foreground">{lead.name}</span>;
      case "scoreBadge":
        return <span className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize whitespace-nowrap ${scoreColors[lead.score] || ""}`}>{lead.score}</span>;
      case "stageProgress":
        if (lead.stage === "rejected") {
          return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-destructive/10 text-destructive whitespace-nowrap">Rejected</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <Progress value={stageProgress[lead.stage]} className="h-2 w-16" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{stageLabel[lead.stage]}</span>
          </div>
        );
      case "careBadge":
        return <span className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${careLevelColors[lead.careLevel]}`}>{lead.careLevel}</span>;
      case "contact":
        return <span className="text-muted-foreground whitespace-nowrap">{lead.contactPerson}{lead.contactRelation ? ` (${lead.contactRelation})` : ""}</span>;
      case "date":
        return <span className="text-muted-foreground whitespace-nowrap">{lead[col.dataKey] ? formatDate(lead[col.dataKey]) : "—"}</span>;
      case "relativeDate":
        return <span className="text-muted-foreground whitespace-nowrap">{daysAgoText(lead[col.dataKey])}</span>;
      case "text":
        return <span className="text-muted-foreground whitespace-nowrap">{lead[col.dataKey || col.id] || ""}</span>;
      case "customText":
      case "customNumber":
      case "customSelect":
        return <span className="text-muted-foreground whitespace-nowrap">{lead[col.id] || "—"}</span>;
      case "customDate":
        return <span className="text-muted-foreground whitespace-nowrap">{lead[col.id] ? formatDate(lead[col.id]) : "—"}</span>;
      default:
        return <span className="text-muted-foreground whitespace-nowrap">{lead[col.dataKey || col.id] || "—"}</span>;
    }
  }
  */

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Leads Pipeline"
        subtitle={`${filteredLeads.length} prospects`}
        action={{ label: "Add Lead", onClick: () => setAddOpen(true) }}
        secondaryAction={{ label: "Import", onClick: () => setImportOpen(true) }}
        bulkAction={selectedLeadIds.size > 0 ? { label: "Send Email", onClick: handleBulkEmailOpen, count: selectedLeadIds.size } : undefined}
        isMobile={isMobile}
        alerts={alerts}
      />

      {/* View toggle + search */}
      <div className="flex items-center gap-2 px-4 pt-3">
        <button
          onClick={() => setView("kanban")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            view === "kanban" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" /> Kanban
        </button>
        {!isMobile && (
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "table" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" /> Table
          </button>
        )}
        {/* COMMENTED OUT - ColumnToggle button
        {view === "table" && !isMobile && (
          <ColumnToggle allColumns={allColumns} visibleIds={visibleIds} onToggle={toggleColumn} onReset={resetToDefaults} />
        )}
        */}
        {!isMobile && view === "table" && (
          <button
            onClick={toggleSelectMode}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              selectMode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" /> Select
          </button>
        )}
        {selectedLeadIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">{selectedLeadIds.size} selected</span>
            <Button size="sm" onClick={handleBulkEmailOpen} className="h-7 gap-1 text-xs">
              <Mail className="h-3 w-3" /> Send Email
            </Button>
            <button onClick={clearSelection} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Clear</button>
          </div>
        )}
        <div className="ml-auto relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-48 pl-8 text-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted">
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {view === "kanban" ? (
          isMobile ? (
            renderMobileKanban()
          ) : (
            <>
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-3 min-w-max">
                {stages.map((stage) => {
                  const stageLeads = kanbanLeads.filter((l) =>
                    l.stage === stage.key
                  );
                  return (
                    <div key={stage.key} className="w-64 flex-shrink-0">
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">{stage.label}</h3>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">{stageLeads.length}</span>
                      </div>
                      <Droppable droppableId={stage.key}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`space-y-2 min-h-[200px] rounded-lg p-2 transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : "bg-muted/30"}`}
                          >
                            {stageLeads.map((lead, index) => (
                              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => setSelectedLead(lead)}
                                    className={`rounded-lg border border-border bg-card p-3 shadow-crm-sm cursor-grab active:cursor-grabbing transition-shadow ${
                                      snapshot.isDragging ? "shadow-crm-lg rotate-1" : "hover:shadow-crm-md"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setRejectTarget(lead); }}
                                            className="p-1 rounded hover:bg-destructive/10 transition-colors"
                                          >
                                            <XCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom"><p>Reject</p></TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <div className="mt-2 space-y-1.5">
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <User className="h-3 w-3" />
                                        <span>{lead.contactPerson}{lead.contactRelation && ` (${lead.contactRelation})`}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <Heart className="h-3 w-3 text-muted-foreground" />
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${careLevelColors[lead.careLevel]}`}>{lead.careLevel}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        <span>{daysAgoText(lead.lastContactDate)}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium capitalize ${scoreColors[lead.score] || ""}`}>{lead.score}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
                <AddStageColumn onAddStage={onAddStage} />
              </div>
            </DragDropContext>
            {rejectedLeads.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowRejected(!showRejected)}
                  className="flex items-center gap-2 mb-3 px-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showRejected ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  <span className="uppercase tracking-wide">Rejections</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-[10px] font-medium text-destructive">{rejectedLeads.length}</span>
                </button>
                {showRejected && (
                  <div className="flex gap-2 flex-wrap">
                    {rejectedLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="w-64 rounded-lg border border-destructive/20 bg-card p-3 shadow-crm-sm cursor-pointer hover:shadow-crm-md transition-shadow opacity-70 hover:opacity-100"
                      >
                        <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Heart className="h-3 w-3 text-muted-foreground" />
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${careLevelColors[lead.careLevel]}`}>{lead.careLevel}</span>
                          </div>
                          {lead.rejectedReason && (
                            <p className="text-[10px] text-muted-foreground truncate">Reason: {lead.rejectedReason}</p>
                          )}
                          {lead.rejectedDate && (
                            <p className="text-[10px] text-muted-foreground">{formatDate(lead.rejectedDate)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            </>
          )
        ) : (
          isMobile ? (
            renderMobileTable()
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectMode && (
                      <TableHead className="w-10 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.size > 0 && selectedLeadIds.size === filteredLeads.length}
                          onChange={toggleSelectAll}
                          className="rounded border-border"
                        />
                      </TableHead>
                    )}
                    <TableHead className="min-w-[150px] sticky left-0 bg-card z-10 whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort("name")}>
                      <div className="inline-flex items-center gap-1">Prospect Name <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="name" /></div>
                    </TableHead>
                    <TableHead className="min-w-[90px] whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <HeaderFilter label="Score" value={filters.score} options={scoreOptions} onChange={(v) => setFilters((f) => ({ ...f, score: v }))} />
                        <button onClick={() => handleSort("score")} className="p-0.5 rounded hover:bg-muted"><SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="score" /></button>
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[170px] whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <HeaderFilter label="Stage" value={filters.stage} options={[...stages.map((s) => s.key), "rejected"]} onChange={(v) => setFilters((f) => ({ ...f, stage: v }))} />
                        <button onClick={() => handleSort("stage")} className="p-0.5 rounded hover:bg-muted"><SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="stage" /></button>
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[110px] whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <HeaderFilter label="Source" value={filters.source} options={sourceOptions} onChange={(v) => setFilters((f) => ({ ...f, source: v }))} />
                        <button onClick={() => handleSort("source")} className="p-0.5 rounded hover:bg-muted"><SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="source" /></button>
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[130px] whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <HeaderFilter label="Care Type" value={filters.careLevel} options={careOptions} onChange={(v) => setFilters((f) => ({ ...f, careLevel: v }))} />
                        <button onClick={() => handleSort("careLevel")} className="p-0.5 rounded hover:bg-muted"><SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="careLevel" /></button>
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[110px] whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <HeaderFilter label="Assign To" value={filters.salesRep} options={salesRepOptions} onChange={(v) => setFilters((f) => ({ ...f, salesRep: v }))} />
                        <button onClick={() => handleSort("salesRep")} className="p-0.5 rounded hover:bg-muted"><SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="salesRep" /></button>
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[120px] whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort("contactPerson")}>
                      <div className="inline-flex items-center gap-1">Contact <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="contactPerson" /></div>
                    </TableHead>
                    <TableHead className="min-w-[95px] whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort("inquiryDate")}>
                      <div className="inline-flex items-center gap-1">Inquiry Date <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="inquiryDate" /></div>
                    </TableHead>
                    <TableHead className="min-w-[95px] whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort("lastContactDate")}>
                      <div className="inline-flex items-center gap-1">Last Contacted <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="lastContactDate" /></div>
                    </TableHead>
                    <TableHead className="min-w-[180px] whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort("nextActivity")}>
                      <div className="inline-flex items-center gap-1">Next Activity <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="nextActivity" /></div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className={`cursor-pointer ${lead.stage === "rejected" ? "opacity-60" : ""}`} onClick={() => selectMode ? toggleLeadSelection(lead.id) : setSelectedLead(lead)}>
                      {selectMode && (
                        <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.has(lead.id)}
                            onChange={() => toggleLeadSelection(lead.id)}
                            className="rounded border-border"
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium text-foreground sticky left-0 bg-card z-10 whitespace-nowrap">{lead.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize whitespace-nowrap ${scoreColors[lead.score] || ""}`}>{lead.score}</span>
                      </TableCell>
                      <TableCell>
                        {lead.stage === "rejected" ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-destructive/10 text-destructive whitespace-nowrap">Rejected</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Progress value={stageProgress[lead.stage]} className="h-2 w-16" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{stageLabel[lead.stage]}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{lead.source}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${careLevelColors[lead.careLevel]}`}>{lead.careLevel}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{lead.salesRep}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {lead.contactPerson}{lead.contactRelation ? ` (${lead.contactRelation})` : ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(lead.inquiryDate)}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{daysAgoText(lead.lastContactDate)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{lead.nextActivity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}
      </div>

      <LeadDetailDialog
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onCall={(lead) => handleCall(lead)}
        onEmail={(lead) => handleEmail(lead)}
        onDelete={(lead) => setDeleteTarget(lead)}
        onStageChange={handleStageChange}
        isMobile={isMobile}
        referrers={referrers}
        setLeads={setLeads}
        setReferrers={setReferrers}
        tasks={tasks}
        onAddTask={onAddTask}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        customFields={customFields}
        stages={stages}
      />

      <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} onLeadCreated={onAddLead} isMobile={isMobile} referrers={referrers} onReferrerAdded={onReferrerAdded} customFields={customFields} stages={stages} />

      <ImportCSVDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        userName={userName}
        existingReferrers={referrers}
        stages={stages}
        onComplete={({ newLeads, newReferrers, existingReferrerUpdates }) => {
          setLeads((prev) => [...prev, ...newLeads]);
          if (newReferrers.length > 0) {
            setReferrers((prev) => [...prev, ...newReferrers]);
          }
          if (existingReferrerUpdates?.length > 0) {
            setReferrers((prev) =>
              prev.map((r) => {
                const update = existingReferrerUpdates.find((u) => u.id === r.id);
                return update ? { ...r, referredLeadIds: update.referredLeadIds } : r;
              })
            );
          }
          // Auto-create tasks for imported leads
          if (executeRules) {
            for (const lead of newLeads) {
              const autoTasks = executeRules("new_lead", lead, stageLabel[lead.stage] || "");
              for (const task of autoTasks) {
                onAddTask?.(task);
              }
            }
          }
        }}
      />

      <CallDialog
        open={!!callTarget}
        onOpenChange={(open) => !open && setCallTarget(null)}
        name={callTarget?.name || ""}
        phone={callTarget?.phone || ""}
      />

      <EmailComposeDialog
        open={!!emailTarget}
        onOpenChange={(open) => !open && setEmailTarget(null)}
        name={emailTarget?.name || ""}
        email={emailTarget?.contactEmail || ""}
        lead={emailTarget}
      />

      <StageChangeModal
        lead={stageChangeLead}
        open={!!stageChangeLead}
        onOpenChange={(open) => !open && setStageChangeLead(null)}
        onStageChange={handleStageChange}
        isMobile={isMobile}
      />

      {/* Reject confirmation dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Reject {rejectTarget?.name}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Reason (optional)</label>
              <Textarea
                placeholder="e.g. Budget too low, not ready to move..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="text-sm min-h-[60px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  handleStageChange(rejectTarget.id, "rejected", rejectReason || undefined);
                  setRejectTarget(null);
                  setRejectReason("");
                }}
              >
                Reject
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {view === "kanban" && !isMobile && (
        <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/60 bg-muted/50 px-4 py-1.5 rounded-full backdrop-blur-sm">Drag and drop prospects to update their pipeline stage</p>
      )}

      {/* Delete lead confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this lead and all their data.
              {deleteTarget?.referrerId && (
                <span className="block mt-2 text-foreground font-medium">
                  This lead was referred by {deleteTarget.referPartner || "a partner"}. The referral link will be removed but the partner will remain.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteLead(deleteTarget)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection email preview & approval dialog */}
      <Dialog open={!!pendingRejectionEmail} onOpenChange={(open) => { if (!open) setPendingRejectionEmail(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send rejection email?</DialogTitle>
            <DialogDescription>
              Review and edit the email before sending to <span className="font-medium text-foreground">{pendingRejectionEmail?.lead?.contactEmail}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground w-10 shrink-0">To:</span>
              <span className="text-foreground font-medium">{pendingRejectionEmail?.lead?.name} &lt;{pendingRejectionEmail?.lead?.contactEmail}&gt;</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-10 shrink-0">Subj:</span>
              <Input
                value={rejectionEmailSubject}
                onChange={(e) => setRejectionEmailSubject(e.target.value)}
                className="flex-1"
              />
            </div>
            <Textarea
              value={rejectionEmailBody}
              onChange={(e) => setRejectionEmailBody(e.target.value)}
              className="min-h-[200px] text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={sendRejectionEmail} disabled={rejectionEmailSending || !rejectionEmailSubject.trim() || !rejectionEmailBody.trim()} className="flex-1">
                <Mail className="h-4 w-4 mr-1.5" />
                {rejectionEmailSending ? "Sending..." : "Send Email"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setPendingRejectionEmail(null)}>
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkEmailOpen} onOpenChange={(open) => { if (!open && !bulkEmailSending) { setBulkEmailOpen(false); setBulkEmailTemplate(""); setBulkEmailSubject(""); setBulkEmailBody(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedLeadIds.size} Lead{selectedLeadIds.size !== 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              {emailableLeads.length} of {selectedLeadIds.size} selected leads have email addresses. Each will receive an individually personalized email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-10 shrink-0">Tpl:</span>
              <select
                value={bulkEmailTemplate}
                onChange={(e) => handleBulkTemplateChange(e.target.value)}
                className="flex-1 text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground"
              >
                <option value="">No template (custom)</option>
                {defaultTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-10 shrink-0">Subj:</span>
              <Input value={bulkEmailSubject} onChange={(e) => setBulkEmailSubject(e.target.value)} placeholder="Subject" className="flex-1" />
            </div>
            <Textarea
              value={bulkEmailBody}
              onChange={(e) => setBulkEmailBody(e.target.value)}
              placeholder="Write your message..."
              className="min-h-[180px]"
            />
            <p className="text-[10px] text-muted-foreground">
              Same email will be sent to each lead individually. Recipients won't see each other.
            </p>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => { setBulkEmailOpen(false); setBulkEmailTemplate(""); setBulkEmailSubject(""); setBulkEmailBody(""); }}>
                Cancel
              </Button>
              <Button onClick={handleBulkEmailSend} disabled={bulkEmailSending || !bulkEmailSubject.trim() || !bulkEmailBody.trim()}>
                <Mail className="h-4 w-4 mr-1.5" />
                {bulkEmailSending ? bulkEmailProgress : `Send ${emailableLeads.length} Email${emailableLeads.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showGmailPrompt} onOpenChange={setShowGmailPrompt}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gmail Required</DialogTitle>
            <DialogDescription>
              Connect your Gmail account to send emails from the CRM.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => { setShowGmailPrompt(false); navigate("integrations"); }} className="flex-1">
              <Link2 className="h-4 w-4 mr-1.5" /> Go to Integrations
            </Button>
            <Button variant="outline" onClick={() => setShowGmailPrompt(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
