import { useState, useRef, useEffect } from "react";
import { Separator } from "@/components/ui/separator";

const placeholders = new Set([
  "No notes provided", "To be assessed", "Budget to be discussed",
  "No preferences recorded yet", "To be determined",
  "Manually entered lead", "Requires initial assessment",
  "Schedule initial call", "Complete intake assessment",
]);

function cleanVal(val) {
  if (Array.isArray(val)) {
    const filtered = val.filter((v) => !placeholders.has(v));
    return filtered.length > 0 ? filtered.join(". ") : "";
  }
  if (typeof val === "string" && placeholders.has(val)) return "";
  return val || "";
}

/* ── Inline editable single-line field ── */
function InlineField({ label, value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);
  const saving = useRef(false);

  const start = () => { setDraft(value || ""); saving.current = false; setEditing(true); };

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commit = () => {
    if (saving.current) return;
    saving.current = true;
    onSave(draft.trim());
    setEditing(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); inputRef.current?.blur(); }
    if (e.key === "Escape") { saving.current = true; setEditing(false); }
  };

  return (
    <div className="min-w-0">
      <span className="text-xs font-medium text-muted-foreground">{label}:</span>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          className="ml-1.5 text-sm text-foreground bg-transparent border-b border-primary outline-none w-[calc(100%-80px)]"
        />
      ) : (
        <span
          onClick={start}
          className="ml-1.5 text-sm cursor-text hover:bg-muted/40 rounded px-0.5 -mx-0.5 py-0.5"
        >
          {value ? (
            <span className="text-foreground">{value}</span>
          ) : (
            <span className="text-muted-foreground/40 italic">Click to add...</span>
          )}
        </span>
      )}
    </div>
  );
}

/* ── Inline editable multi-line field ── */
function InlineMultiLine({ label, value, onSave, sectionType = "list" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef(null);
  const saving = useRef(false);

  const start = () => { setDraft(value || ""); saving.current = false; setEditing(true); };

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.selectionStart = el.selectionEnd = el.value.length;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [editing]);

  const commit = () => {
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

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); textareaRef.current?.blur(); }
    if (e.key === "Escape") { saving.current = true; setEditing(false); }
  };

  return (
    <div>
      <p className="text-xs font-semibold text-foreground mb-1">{label}:</p>
      {editing ? (
        <div className="rounded-md bg-muted/40 border border-dashed border-muted-foreground/25 px-2 py-1">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
            onBlur={commit}
            onKeyDown={handleKey}
            className="w-full text-sm text-foreground leading-relaxed bg-transparent border-none outline-none resize-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
            rows={2}
          />
        </div>
      ) : (
        <p
          onClick={start}
          className="text-sm text-muted-foreground leading-relaxed cursor-text rounded-md px-2 -mx-0.5 py-1 hover:bg-muted/40 min-h-[2.5rem] whitespace-pre-wrap"
        >
          {value || <span className="italic text-muted-foreground/40">Click to add...</span>}
        </p>
      )}
    </div>
  );
}

export default function EditableIntakeContent({ lead, referrers = [] }) {
  const n = lead.intakeNote || {};

  // Find linked referrer
  const referrer = lead.referrerId
    ? referrers.find((r) => r.id === lead.referrerId)
    : null;

  const isReferral = (n.leadSource || lead.source || "").toLowerCase().includes("referral");

  // State for all fields
  const [fields, setFields] = useState(() => ({
    age: lead.age || "",
    zipcode: n.zipcode || "",
    contactPerson: lead.contactPerson || n.caller || "",
    relationship: lead.contactRelation || "",
    email: lead.contactEmail || "",
    phone: lead.contactPhone || "",
    assignTo: n.salesRep || lead.salesRep || "",
    leadSource: n.leadSource || lead.source || "",
    referPartner: lead.referPartner || referrer?.name || referrer?.organization || "",
    referredBy: lead.referredBy || referrer?.contactPerson || "",
    nextSteps: cleanVal(n.nextStep),
    careType: lead.careLevel || "",
    hoursPerDay: lead.hoursPerDay || "",
    timeline: cleanVal(n.timeline) || lead.timeline || "",
    budget: cleanVal(n.budgetFinancial) || lead.budget || "",
    preferences: cleanVal(n.preferences),
    objections: cleanVal(n.objections),
    personalNotes: lead.personalNotes || cleanVal(n.situationSummary) || "",
  }));

  const update = (key, val) => {
    setFields((prev) => ({ ...prev, [key]: val }));
    // Persist back to lead object
    switch (key) {
      case "age": lead.age = val; break;
      case "zipcode": if (n) n.zipcode = val; break;
      case "contactPerson": lead.contactPerson = val; if (n) n.caller = val; break;
      case "relationship": lead.contactRelation = val; break;
      case "email": lead.contactEmail = val; break;
      case "phone": lead.contactPhone = val; break;
      case "assignTo": if (n) n.salesRep = val; lead.salesRep = val; break;
      case "leadSource": if (n) n.leadSource = val; lead.source = val; break;
      case "referPartner": lead.referPartner = val; break;
      case "referredBy": lead.referredBy = val; break;
      case "careType": lead.careLevel = val; break;
      case "hoursPerDay": lead.hoursPerDay = val; break;
      case "timeline": if (n) n.timeline = val; lead.timeline = val; break;
      case "budget": if (n) n.budgetFinancial = Array.isArray(val) ? val : [val]; lead.budget = Array.isArray(val) ? val.join(". ") : val; break;
      case "personalNotes": lead.personalNotes = val; break;
    }
  };

  const updateMulti = (key, val) => {
    const display = Array.isArray(val) && val.length > 0 ? val.join(". ") : (Array.isArray(val) ? "" : val || "");
    setFields((prev) => ({ ...prev, [key]: display }));
    switch (key) {
      case "nextSteps": if (n) n.nextStep = Array.isArray(val) ? val : [val]; break;
      case "preferences": if (n) n.preferences = Array.isArray(val) ? val : [val]; break;
      case "objections": if (n) n.objections = Array.isArray(val) ? val : [val]; break;
    }
  };

  const showReferral = isReferral || fields.leadSource.toLowerCase().includes("referral");

  return (
    <div className="space-y-5">
      {/* ── Information ── */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Information</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          <InlineField label="Age" value={fields.age} onSave={(v) => update("age", v)} />
          <InlineField label="Zipcode" value={fields.zipcode} onSave={(v) => update("zipcode", v)} />
          <InlineField label="Contact Person" value={fields.contactPerson} onSave={(v) => update("contactPerson", v)} />
          <InlineField label="Relationship" value={fields.relationship} onSave={(v) => update("relationship", v)} />
          <InlineField label="Email" value={fields.email} onSave={(v) => update("email", v)} />
          <InlineField label="Phone" value={fields.phone} onSave={(v) => update("phone", v)} />
          <InlineField label="Assign To" value={fields.assignTo} onSave={(v) => update("assignTo", v)} />
          <InlineField label="Lead Source" value={fields.leadSource} onSave={(v) => update("leadSource", v)} />
          {showReferral && (
            <>
              <InlineField label="Refer Partner" value={fields.referPartner} onSave={(v) => update("referPartner", v)} />
              <InlineField label="Referred by" value={fields.referredBy} onSave={(v) => update("referredBy", v)} />
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* ── Care Needs ── */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Care Needs</h4>
        <InlineMultiLine label="Next Steps" value={fields.nextSteps} onSave={(v) => updateMulti("nextSteps", v)} />
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-3">
          <InlineField label="Type of care" value={fields.careType} onSave={(v) => update("careType", v)} />
          <InlineField label="Hours of care/day" value={fields.hoursPerDay} onSave={(v) => update("hoursPerDay", v)} />
          <InlineField label="Timeline" value={fields.timeline} onSave={(v) => update("timeline", v)} />
          <InlineField label="Budget" value={fields.budget} onSave={(v) => update("budget", v)} />
        </div>
      </div>

      <Separator />

      {/* ── Preference ── */}
      <InlineMultiLine label="Preference" value={fields.preferences} onSave={(v) => updateMulti("preferences", v)} />

      <Separator />

      {/* ── Objections / Concerns ── */}
      <InlineMultiLine label="Objection / Concerns" value={fields.objections} onSave={(v) => updateMulti("objections", v)} />

      <Separator />

      {/* ── Personal Notes ── */}
      <InlineMultiLine label="Personal Notes" value={fields.personalNotes} onSave={(v) => { const text = typeof v === "string" ? v : Array.isArray(v) ? v.join(". ") : ""; update("personalNotes", text); if (n) n.situationSummary = text ? [text] : []; }} sectionType="single" />
    </div>
  );
}
