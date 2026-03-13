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

export default function EditableIntakeContent({ lead }) {
  const n = lead.intakeNote;
  const [editingMustKnow, setEditingMustKnow] = useState(false);
  const [mustKnowDraft, setMustKnowDraft] = useState("");
  const [personalNotes, setPersonalNotes] = useState(lead.personalNotes || "");
  const [intakeState, setIntakeState] = useState(() => {
    const placeholders = new Set([
      "No notes provided", "To be assessed", "Budget to be discussed",
      "No preferences recorded yet", "To be determined",
      "Manually entered lead", "Requires initial assessment",
      "Schedule initial call", "Complete intake assessment",
    ]);
    const init = {};
    for (const sec of sections) {
      let val = n[sec.key];
      if (Array.isArray(val)) {
        val = val.filter((v) => !placeholders.has(v));
      } else if (typeof val === "string" && placeholders.has(val)) {
        val = "";
      }
      init[sec.key] = Array.isArray(val) && val.length > 0 ? val.join(". ") + "." : (Array.isArray(val) ? "" : val || "");
    }
    return init;
  });

  const handleSave = (key, newVal) => {
    n[key] = newVal;
    const display = Array.isArray(newVal) && newVal.length > 0 ? newVal.join(". ") + "." : (Array.isArray(newVal) ? "" : newVal || "");
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

      <Separator />

      {/* Personal Notes */}
      <div>
        <SectionHeader icon={User} title="Personal Notes" />
        <InlineEditableText
          displayValue={personalNotes}
          onSave={(val) => {
            const text = Array.isArray(val) ? val.join(". ") : val;
            lead.personalNotes = text;
            setPersonalNotes(text);
          }}
          sectionType="single"
        />
      </div>

      <Separator />

      {/* Header fields */}
      <div>
        <SectionHeader icon={MapPin} title="Lead Source" />
        <InlineEditableInput displayValue={n.leadSource || ""} onSave={(v) => { n.leadSource = v; }} />
      </div>
      <div>
        <SectionHeader icon={MapPin} title="Zipcode" />
        <InlineEditableInput displayValue={n.zipcode || ""} onSave={(v) => { n.zipcode = v; }} />
      </div>
      <div>
        <SectionHeader icon={User} title="Caller" />
        <InlineEditableInput displayValue={n.caller || ""} onSave={(v) => { n.caller = v; }} />
      </div>
      <div>
        <SectionHeader icon={User} title="Assigned To" />
        <InlineEditableInput displayValue={n.salesRep || ""} onSave={(v) => { n.salesRep = v; }} />
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
