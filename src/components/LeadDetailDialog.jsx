import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, User, Sparkles, Loader2, Eye, MessageSquare, ArrowRightLeft, Users, Plus, ChevronDown, X } from "lucide-react";

import { toast } from "@/hooks/use-toast";
import AudioNoteRecorder from "@/components/lead-detail/AudioNoteRecorder";
import EditableIntakeContent from "@/components/lead-detail/EditableIntakeContent";
import { createActivityLog, fetchActivityLogs } from "@/services/supabaseActivityLogs";

const careLevelColors = {
  "Assisted Living": "bg-info/10 text-info border-info/20",
  "Independent Living": "bg-success/10 text-success border-success/20",
  "Memory Care": "bg-warning/10 text-warning border-warning/20",
  "Skilled Nursing": "bg-destructive/10 text-destructive border-destructive/20",
};

const scoreColors = {
  hot: "bg-destructive/15 text-destructive border-destructive/30",
  warm: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  cold: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  nurture: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
};

const scoreOptions = ["hot", "warm", "nurture", "cold"];

function EditableScoreBadge({ score, onChange }) {
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
      <Badge
        variant="outline"
        className={`capitalize cursor-pointer ${scoreColors[score] || ""}`}
        onClick={() => setOpen(!open)}
      >
        {score || "—"}
        <ChevronDown className="h-2.5 w-2.5 ml-1" />
      </Badge>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 rounded-md border border-border bg-popover shadow-lg py-1 min-w-[100px]">
          {scoreOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs capitalize hover:bg-muted transition-colors ${score === opt ? "font-semibold text-primary" : "text-foreground"}`}
            >{opt}</button>
          ))}
        </div>
      )}
    </div>
  );
}

const stageLabel = {
  inquiry: "Inquiry",
  assessment_scheduled: "Assessment Scheduled",
  assessment_completed: "Assessment Completed",
  proposal_sent: "Proposal Sent",
  pending_decision: "Pending Decision",
  closed: "Closed",
};

function generateMockSummary(lead) {
  const n = lead.intakeNote;

  let summary = `**${lead.name}** is a ${lead.careLevel.toLowerCase()} prospect currently in the **${stageLabel[lead.stage]}** stage. ${n.caller} reached out via ${n.leadSource.toLowerCase()}.

**Key situation:** ${n.situationSummary[0]}. ${n.situationSummary.length > 1 ? n.situationSummary[1] + "." : ""}

**Care needs** include ${n.careNeeds.slice(0, 3).join(", ").toLowerCase()}. The family's budget is ${n.budgetFinancial[0].toLowerCase()}.

**Decision makers:** ${n.decisionMakers.join("; ")}. **Timeline:** ${n.timeline.toLowerCase()}.

**Main concerns:** ${n.objections.join("; ").toLowerCase()}.`;

  const tours = lead.tourNotes || [];
  if (tours.length > 0) {
    summary += `\n\n**Tours taken: ${tours.length}**`;
    tours.forEach((t, i) => {
      summary += `\n**Tour ${i + 1}** (${formatTimelineDate(t.tourDate)}) — ${t.attendees}: ${t.summary}`;
    });
  }

  summary += `

**Sales assessment:** ${n.salesRepAssessment.join(". ")}. **Next steps:** ${n.nextStep.join("; ")}.`;

  return summary;
}

const interactionIcons = {
  call: Phone,
  email: Mail,
  tour: Eye,
  note: MessageSquare,
  stage_change: ArrowRightLeft,
  meeting: Users,
};

const interactionColors = {
  call: "bg-info/10 text-info",
  email: "bg-primary/10 text-primary",
  tour: "bg-success/10 text-success",
  note: "bg-warning/10 text-warning",
  stage_change: "bg-muted text-muted-foreground",
  meeting: "bg-accent text-accent-foreground",
};

function formatTimelineDate(dateStr) {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function TimelineContent({ interactions, onAddNote }) {
  const [addingNote, setAddingNote] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {!addingNote && (
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setAddingNote(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Note
          </Button>
        )}
      </div>

      {addingNote && (
        <AudioNoteRecorder onAddNote={(note) => { onAddNote(note); setAddingNote(false); }} onCancel={() => setAddingNote(false)} />
      )}

      {/* Timeline */}
      <div className="relative space-y-0">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
        {interactions.map((entry) => {
          const Icon = interactionIcons[entry.type];
          const colorClass = interactionColors[entry.type];
          const isTour = entry.type === "tour" && entry.tourNote;
          return (
            <div key={entry.id} className="relative flex gap-3 pb-4">
              <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{entry.title}</span>
                  <span className="text-[10px] text-muted-foreground">{formatTimelineDate(entry.date)}</span>
                </div>
                {isTour && (
                  <p className="text-[11px] text-foreground/70 mt-0.5">
                    <span className="font-medium">Attendees:</span> {entry.tourNote.attendees}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{entry.description}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">by {entry.by}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LeadDetailDialog({ lead, open, onOpenChange, onCall, onEmail, isMobile }) {
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [localInteractions, setLocalInteractions] = useState([]);
  const [dbInteractions, setDbInteractions] = useState([]);
  const [localScore, setLocalScore] = useState(null);

  // Fetch saved activity logs from DB when lead changes
  useEffect(() => {
    if (!lead?.id) return;
    setLocalInteractions([]);
    setDbInteractions([]);
    fetchActivityLogs(lead.id)
      .then((logs) => {
        const mapped = logs.map((log) => ({
          id: log.id,
          date: log.date,
          type: log.type,
          title: log.title,
          description: log.description,
          by: log.by,
          tourNote: log.tour_note,
        }));
        setDbInteractions(mapped);
      })
      .catch((err) => console.error('Failed to fetch activity logs:', err));
  }, [lead?.id]);

  // Merge: local (unsaved optimistic) + db (persisted) + mock generated
  const interactions = lead ? [...localInteractions, ...dbInteractions, ...lead.interactions] : [];

  if (!lead) return null;

  const handleAiSummary = () => {
    setAiLoading(true);
    setAiSummary(null);
    setTimeout(() => {
      setAiSummary(generateMockSummary(lead));
      setAiLoading(false);
    }, 1500);
  };

  const handleClose = (openState) => {
    if (!openState) {
      setAiSummary(null);
      setAiLoading(false);
      setLocalScore(null);
    }
    onOpenChange(openState);
  };

  const currentScore = localScore || lead?.score || "cold";

  const handleAddNote = (note) => {
    setLocalInteractions((prev) => [note, ...prev]);
    createActivityLog({
      leadId: lead.id,
      type: note.type,
      title: note.title,
      description: note.description,
      by: note.by,
      date: note.date,
    }).catch((err) => console.error('Failed to save activity log:', err));
  };


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent fullScreen={isMobile} className={isMobile ? "" : "max-w-2xl max-h-[85vh] overflow-y-auto"}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Phone className="h-3 w-3" />
              <span>Lead Detail</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAiSummary}
              disabled={aiLoading}
              className="flex items-center gap-1.5 text-xs"
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              )}
              AI Summary
            </Button>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">{lead.name}</DialogTitle>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <button
              onClick={() => onCall?.(lead)}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Phone className="h-3 w-3" />{lead.contactPhone}
            </button>
            <button
              onClick={() => onEmail?.(lead)}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Mail className="h-3 w-3" />{lead.contactEmail}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <EditableScoreBadge score={currentScore} onChange={(s) => { setLocalScore(s); if (lead) lead.score = s; }} />
            <Badge variant="outline" className={careLevelColors[lead.careLevel]}>{lead.careLevel}</Badge>
            <Badge variant="secondary">{stageLabel[lead.stage]}</Badge>
          </div>
        </DialogHeader>

        {/* AI Summary */}
        {(aiLoading || aiSummary) && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">AI Summary</h4>
              </div>
              {!aiLoading && (
                <button onClick={() => setAiSummary(null)} className="p-0.5 rounded hover:bg-muted transition-colors">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing prospect data...
              </div>
            ) : (
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {aiSummary?.split("**").map((part, i) =>
                  i % 2 === 1 ? (
                    <strong key={i} className="text-foreground font-medium">{part}</strong>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="intake" className="mt-2">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="intake">☎️ Intake</TabsTrigger>
            <TabsTrigger value="timeline">📋 Activity Log</TabsTrigger>
          </TabsList>
          <TabsContent value="intake" className="mt-4">
            <EditableIntakeContent lead={lead} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-4">
            <TimelineContent interactions={interactions} onAddNote={handleAddNote} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
