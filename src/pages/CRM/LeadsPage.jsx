import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { updateLead } from "@/services/supabaseLeads";
import TopBar from "@/components/TopBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { User, Calendar, Heart, LayoutGrid, Table as TableIcon, ChevronDown, X, Phone, Mail, StickyNote, ArrowRightLeft, Check, Trash2, Eye, EyeOff } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import LeadDetailDialog from "@/components/LeadDetailDialog";
import AddLeadDialog from "@/components/AddLeadDialog";
import CallDialog from "@/components/CallDialog";
import EmailComposeDialog from "@/components/EmailComposeDialog";

const stages = [
  { key: "inquiry", label: "Inquiry" },
  { key: "assessment_scheduled", label: "Assessment Scheduled" },
  { key: "assessment_completed", label: "Assessment Completed" },
  { key: "proposal_sent", label: "Proposal Sent" },
  { key: "pending_decision", label: "Pending Decision" },
  { key: "closed", label: "Closed" },
];

const stageProgress = {
  inquiry: 10, assessment_scheduled: 25, assessment_completed: 45, proposal_sent: 65, pending_decision: 85, closed: 100, rejected: 0,
};

const stageLabel = {
  inquiry: "Inquiry", assessment_scheduled: "Assessment Scheduled", assessment_completed: "Assessment Completed", proposal_sent: "Proposal Sent", pending_decision: "Pending Decision", closed: "Closed", rejected: "Rejected",
};

const careLevelColors = {
  "Assisted Living": "bg-info/10 text-info",
  "Independent Living": "bg-success/10 text-success",
  "Memory Care": "bg-warning/10 text-warning",
  "Skilled Nursing": "bg-destructive/10 text-destructive",
};

const scoreColors = {
  hot: "bg-destructive/15 text-destructive",
  warm: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  cold: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  nurture: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const sourceOptions = ["Digital Ads", "Event", "Phone Call", "Referral", "Walk-in", "Website"];
const careOptions = ["Assisted Living", "Independent Living", "Memory Care", "Skilled Nursing"];
const scoreOptions = ["cold", "hot", "nurture", "warm"];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
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
            <span className="flex items-center gap-2"><Trash2 className="h-4 w-4" /> Reject</span>
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

export default function LeadsPage({ leads, setLeads, onAddLead, autoOpenLeadId, onAutoOpenHandled, referrers = [] }) {
  const isMobile = useIsMobile();
  const [view, setView] = useState("table");
  const [selectedLead, setSelectedLead] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState({ stage: "all", source: "all", careLevel: "all", salesRep: "all", score: "all" });
  const [stageChangeLead, setStageChangeLead] = useState(null);
  const [kanbanCareFilter, setKanbanCareFilter] = useState("all");
  const [showRejected, setShowRejected] = useState(false);

  // Call & Email dialog state
  const [callTarget, setCallTarget] = useState(null);
  const [emailTarget, setEmailTarget] = useState(null);

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
    return leads.filter((l) => {
      if (filters.stage !== "all" && l.stage !== filters.stage) return false;
      if (filters.source !== "all" && l.source !== filters.source) return false;
      if (filters.careLevel !== "all" && l.careLevel !== filters.careLevel) return false;
      if (filters.salesRep !== "all" && l.salesRep !== filters.salesRep) return false;
      if (filters.score !== "all" && l.score !== filters.score) return false;
      return true;
    });
  }, [leads, filters]);

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
  }, [leads, setLeads]);

  const handleStageChange = useCallback((leadId, newStage, rejectReason) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const updated = { ...l, stage: newStage };
          if (newStage === "rejected") {
            updated.rejectedReason = rejectReason || "";
            updated.rejectedDate = new Date().toISOString().split("T")[0];
          }
          updateLead(leadId, updated).catch(console.error);
          return updated;
        }
        return l;
      })
    );
  }, [setLeads]);

  // Reject lead from kanban trash icon
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleCall = (lead) => {
    setCallTarget({ name: lead.name, phone: lead.contactPhone });
  };

  const handleEmail = (lead) => {
    setEmailTarget({ name: lead.name, email: lead.contactEmail });
  };

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
                      <button
                        onClick={() => setRejectTarget(lead)}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
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
                        <span>{formatDate(lead.lastContactDate)}</span>
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
            <span>{formatDate(lead.lastContactDate)}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Leads Pipeline"
        subtitle={`${filteredLeads.length} prospects`}
        action={{ label: "Add Lead", onClick: () => setAddOpen(true) }}
        isMobile={isMobile}
      />

      {/* View toggle */}
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
        {view === "kanban" && !isMobile && (
          <div className="flex items-center gap-1.5 ml-4">
            <select
              value={kanbanCareFilter}
              onChange={(e) => setKanbanCareFilter(e.target.value)}
              className="h-7 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Care Types</option>
              {careOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
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
                    l.stage === stage.key && (kanbanCareFilter === "all" || l.careLevel === kanbanCareFilter)
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
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setRejectTarget(lead); }}
                                        className="p-1 rounded hover:bg-destructive/10 transition-colors"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                      </button>
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
                                        <span>{formatDate(lead.lastContactDate)}</span>
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
                    <TableHead className="min-w-[150px] sticky left-0 bg-card z-10 whitespace-nowrap">Prospect Name</TableHead>
                    <TableHead className="min-w-[90px] whitespace-nowrap">
                      <HeaderFilter label="Score" value={filters.score} options={scoreOptions} onChange={(v) => setFilters((f) => ({ ...f, score: v }))} />
                    </TableHead>
                    <TableHead className="min-w-[170px] whitespace-nowrap">
                      <HeaderFilter label="Stage" value={filters.stage} options={[...stages.map((s) => s.key), "rejected"]} onChange={(v) => setFilters((f) => ({ ...f, stage: v }))} />
                    </TableHead>
                    <TableHead className="min-w-[110px] whitespace-nowrap">
                      <HeaderFilter label="Source" value={filters.source} options={sourceOptions} onChange={(v) => setFilters((f) => ({ ...f, source: v }))} />
                    </TableHead>
                    <TableHead className="min-w-[130px] whitespace-nowrap">
                      <HeaderFilter label="Care Type" value={filters.careLevel} options={careOptions} onChange={(v) => setFilters((f) => ({ ...f, careLevel: v }))} />
                    </TableHead>
                    <TableHead className="min-w-[110px] whitespace-nowrap">
                      <HeaderFilter label="Assign To" value={filters.salesRep} options={salesRepOptions} onChange={(v) => setFilters((f) => ({ ...f, salesRep: v }))} />
                    </TableHead>
                    <TableHead className="min-w-[120px] whitespace-nowrap">Contact</TableHead>
                    <TableHead className="min-w-[95px] whitespace-nowrap">Inquiry Date</TableHead>
                    <TableHead className="min-w-[95px] whitespace-nowrap">Initial Contact</TableHead>
                    <TableHead className="min-w-[95px] whitespace-nowrap">Last Contact</TableHead>
                    <TableHead className="min-w-[180px] whitespace-nowrap">Next Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className={`cursor-pointer ${lead.stage === "rejected" ? "opacity-60" : ""}`} onClick={() => setSelectedLead(lead)}>
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
                      <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(lead.initialContact)}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(lead.lastContactDate)}</TableCell>
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
        onStageChange={handleStageChange}
        isMobile={isMobile}
      />

      <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} onLeadCreated={onAddLead} isMobile={isMobile} referrers={referrers} />

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
        email={emailTarget?.email || ""}
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
    </div>
  );
}
