import { useState, useRef, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, User, Calendar, Heart, DollarSign, Clock, AlertTriangle, TrendingUp, ArrowRight, Pencil, Save, X, AlertCircle, Gift, Gem, Timer } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function daysAgoText(dateStr) {
  if (!dateStr) return "—";
  const now = new Date();
  const d = new Date(dateStr);
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 60) return "1 month ago";
  return `${Math.floor(diffDays / 30)} months ago`;
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-4 w-4 text-primary" />
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    </div>
  );
}

const sections = [
  { key: "situationSummary", icon: User, title: "Situation Summary", type: "list" },
  { key: "careNeeds", icon: Heart, title: "Care Needs", type: "list" },
  { key: "budgetFinancial", icon: DollarSign, title: "Budget & Financial", type: "list" },
  { key: "decisionMakers", icon: User, title: "Decision Makers", type: "list" },
  { key: "timeline", icon: Clock, title: "Timeline", type: "single" },
  { key: "preferences", icon: Heart, title: "Preferences", type: "list" },
  { key: "objections", icon: AlertTriangle, title: "Objections / Concerns", type: "list" },
  { key: "salesRepAssessment", icon: TrendingUp, title: "Sales Rep Assessment", type: "list" },
  { key: "nextStep", icon: ArrowRight, title: "Next Steps", type: "list" },
];

function InlineEditableText({ displayValue, onSave, sectionType }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef(null);
  const saving = useRef(false);

  const startEditing = () => {
    setDraft(displayValue);
    saving.current = false;
    setEditing(true);
  };

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.selectionStart = el.selectionEnd = el.value.length;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [editing]);

  const handleInput = (e) => {
    setDraft(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const commitEdit = () => {
    if (saving.current) return;
    saving.current = true;
    const trimmed = draft.trim();
    let newVal;
    if (sectionType === "list") {
      newVal = trimmed.split(/\.\s*/).filter(Boolean);
    } else {
      newVal = trimmed;
    }
    onSave(newVal);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      textareaRef.current?.blur();
    }
    if (e.key === "Escape") {
      saving.current = true;
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="rounded-md bg-muted/40 border border-dashed border-muted-foreground/25 -mx-1 px-1 py-1">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={handleInput}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-full pl-6 text-sm text-foreground leading-relaxed bg-transparent border-none outline-none resize-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
          rows={1}
        />
      </div>
    );
  }

  return (
    <p
      onClick={startEditing}
      className="pl-6 text-sm text-muted-foreground leading-relaxed cursor-text rounded-md px-1 -mx-1 py-1 hover:bg-muted/40"
    >
      {displayValue || <span className="italic text-muted-foreground/50">Click to add...</span>}
    </p>
  );
}

function InlineEditableInput({ displayValue, onSave, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);
  const saving = useRef(false);

  const startEditing = () => {
    setDraft(displayValue || "");
    saving.current = false;
    setEditing(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const commitEdit = () => {
    if (saving.current) return;
    saving.current = true;
    onSave(draft.trim());
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      saving.current = true;
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="rounded-md bg-muted/40 border border-dashed border-muted-foreground/25 -mx-1 px-1 py-1">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-6 text-sm text-foreground bg-transparent border-none outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
        />
      </div>
    );
  }

  return (
    <p
      onClick={startEditing}
      className="pl-6 text-sm text-muted-foreground leading-relaxed cursor-text rounded-md px-1 -mx-1 py-1 hover:bg-muted/40"
    >
      {displayValue || <span className="italic text-muted-foreground/50">{placeholder || "Click to add..."}</span>}
    </p>
  );
}

function HeaderField({ icon: Icon, label, value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [display, setDisplay] = useState(value || "");
  const inputRef = useRef(null);

  const startEditing = () => {
    setDraft(display);
    setEditing(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    onSave(trimmed);
    setDisplay(trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); inputRef.current?.blur(); }
    if (e.key === "Escape") setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="shrink-0">{label}:</span>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 text-sm text-foreground font-medium bg-background/50 border border-dashed border-muted-foreground/25 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-muted-foreground cursor-text hover:bg-muted/60 rounded px-1 -mx-1 py-0.5" onClick={startEditing}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}: <span className="text-foreground font-medium">{display || <span className="italic text-muted-foreground/50">Click to add...</span>}</span></span>
    </div>
  );
}

export default function EditableIntakeContent({ lead }) {
  const n = lead.intakeNote;
  const [editingMustKnow, setEditingMustKnow] = useState(false);
  const [mustKnowDraft, setMustKnowDraft] = useState("");
  const [maritalStatus, setMaritalStatus] = useState(lead.maritalStatus || "");
  const [specialDates, setSpecialDates] = useState(
    lead.specialDates && lead.specialDates.length > 0
      ? lead.specialDates.map((sd) => `${sd.type}: ${sd.date}`).join(", ")
      : ""
  );
  const [intakeState, setIntakeState] = useState(() => {
    const init = {};
    for (const sec of sections) {
      const val = n[sec.key];
      init[sec.key] = Array.isArray(val) ? val.join(". ") + "." : val || "";
    }
    return init;
  });

  const handleSave = (key, newVal) => {
    n[key] = newVal;
    const display = Array.isArray(newVal) ? newVal.join(". ") + "." : newVal || "";
    setIntakeState((prev) => ({ ...prev, [key]: display }));
  };

  return (
    <div className="space-y-5">
      {/* Must-Know Banner */}
      {(lead.mustKnow || editingMustKnow) && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-xs font-semibold text-warning">Must Know</p>
              {!editingMustKnow ? (
                <button
                  onClick={() => { setMustKnowDraft(lead.mustKnow || ""); setEditingMustKnow(true); }}
                  className="p-0.5 rounded hover:bg-warning/20"
                >
                  <Pencil className="h-3 w-3 text-warning" />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingMustKnow(false)}
                    className="p-0.5 rounded hover:bg-warning/20"
                  >
                    <X className="h-3 w-3 text-warning" />
                  </button>
                  <button
                    onClick={() => { lead.mustKnow = mustKnowDraft.trim(); setEditingMustKnow(false); toast({ title: "Must Know updated" }); }}
                    className="p-0.5 rounded hover:bg-warning/20"
                  >
                    <Save className="h-3 w-3 text-warning" />
                  </button>
                </div>
              )}
            </div>
            {editingMustKnow ? (
              <Textarea
                value={mustKnowDraft}
                onChange={(e) => setMustKnowDraft(e.target.value)}
                className="text-sm min-h-[50px] bg-background/50 border-warning/30"
                autoFocus
              />
            ) : (
              <p className="text-sm text-foreground leading-relaxed">{lead.mustKnow}</p>
            )}
          </div>
        </div>
      )}

      {/* Header info */}
      <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
        <HeaderField icon={MapPin} label="Lead Source" value={n.leadSource} onSave={(v) => { n.leadSource = v; }} />
        <HeaderField icon={MapPin} label="Zipcode" value={n.zipcode} onSave={(v) => { n.zipcode = v; }} />
        <HeaderField icon={User} label="Caller" value={n.caller} onSave={(v) => { n.caller = v; }} />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          <span>Last Contacted: <span className="text-foreground font-medium">{daysAgoText(lead.lastContactDate)}</span></span>
        </div>
        <HeaderField icon={User} label="Assigned To" value={n.salesRep} onSave={(v) => { n.salesRep = v; }} />
      </div>

      <Separator />

      {/* Personal Info */}
      <div>
        <SectionHeader icon={Gem} title="Marital Status" />
        <InlineEditableInput
          displayValue={maritalStatus}
          onSave={(val) => { lead.maritalStatus = val; setMaritalStatus(val); }}
          placeholder="e.g. Single, Married, Widow"
        />
      </div>
      <div>
        <SectionHeader icon={Gift} title="Special Dates" />
        <InlineEditableInput
          displayValue={specialDates}
          onSave={(val) => {
            lead.specialDates = val.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
              const [type, ...rest] = s.split(":");
              return { type: type.trim(), date: (rest.join(":") || "").trim() };
            });
            setSpecialDates(val);
          }}
          placeholder="e.g. Birthday: Mar 15, Anniversary: Jun 18"
        />
      </div>

      <Separator />

      {sections.map((sec) => (
        <div key={sec.key}>
          <SectionHeader icon={sec.icon} title={sec.title} />
          <InlineEditableText
            displayValue={intakeState[sec.key]}
            onSave={(newVal) => handleSave(sec.key, newVal)}
            sectionType={sec.type}
          />
        </div>
      ))}
    </div>
  );
}
