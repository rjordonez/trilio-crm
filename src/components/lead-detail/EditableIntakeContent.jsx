import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { Pencil, ChevronDown } from "lucide-react";
import { updateLead } from "@/services/supabaseLeads";
import { updateReferrer, createReferrer } from "@/services/supabaseReferrers";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
    <div className="min-w-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <span className="text-xs font-medium text-muted-foreground shrink-0">{label}:</span>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          className="text-sm text-foreground bg-transparent border-b border-primary outline-none flex-1 min-w-[100px]"
        />
      ) : (
        <span
          onClick={start}
          className="text-sm cursor-text hover:bg-muted/40 rounded px-0.5 py-0.5 inline-flex items-center gap-1 min-w-0"
        >
          {value ? (
            <span className="text-foreground break-all">{value}</span>
          ) : (
            <span className="text-muted-foreground/40 italic">Click to add...</span>
          )}
          <Pencil className="h-3 w-3 text-muted-foreground/50 shrink-0" />
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
      <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
        {label}:
        {!editing && <Pencil className="h-3 w-3 text-muted-foreground/50" />}
      </p>
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

/* ── Inline select dropdown field ── */
function InlineSelect({ label, value, options, onSave }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="min-w-0 relative" ref={ref}>
      <span className="text-xs font-medium text-muted-foreground">{label}:</span>
      <span
        onClick={() => setOpen(!open)}
        className="ml-1.5 text-sm cursor-pointer hover:bg-muted/40 rounded px-0.5 py-0.5 inline-flex items-center gap-1"
      >
        {value ? (
          <span className="text-foreground">{value}</span>
        ) : (
          <span className="text-muted-foreground/40 italic">Select...</span>
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground/50 shrink-0" />
      </span>
      {open && (
        <div className="absolute z-[100] mt-1 left-0 w-56 max-h-48 overflow-auto rounded-md border border-border bg-popover shadow-md">
          {options.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No options</p>
          )}
          {value && (
            <button
              onClick={() => { onSave(""); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              Clear
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onSave(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors ${opt.value === value ? "bg-muted font-medium" : ""}`}
            >
              <span className="text-foreground">{opt.label}</span>
              {opt.sub && <span className="block text-[10px] text-muted-foreground">{opt.sub}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const partnerTypes = [
  "Hospital / Facility",
  "Physician / Clinician",
  "Social Worker / Case Manager",
  "Community Organization / Nonprofit",
  "Current Client / Family",
  "Home Health Agency",
  "Placement Specialist",
  "Other",
];

export default function EditableIntakeContent({ lead, referrers = [], setLeads, setReferrers, onSaveStatusChange, customFields = [] }) {
  const { organization } = useAuth();
  const n = lead.intakeNote || {};

  // Find linked referrer
  const referrer = lead.referrerId
    ? referrers.find((r) => r.id === lead.referrerId)
    : null;

  const isReferral = (n.leadSource || lead.source || "").toLowerCase().includes("referral");

  // Inline add partner state
  const [addingPartner, setAddingPartner] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: "", contactPerson: "", contactTitle: "", email: "", phone: "", type: "", notes: "" });
  const [savingPartner, setSavingPartner] = useState(false);
  const setPartner = (key, val) => setPartnerForm((f) => ({ ...f, [key]: val }));
  const partnerValid = partnerForm.name && partnerForm.contactPerson && partnerForm.email && partnerForm.type;
  const resetPartnerForm = () => setPartnerForm({ name: "", contactPerson: "", contactTitle: "", email: "", phone: "", type: "", notes: "" });

  const saveTimerRef = useRef(null);
  const clearStatusRef = useRef(null);
  const setStatus = useCallback((s) => { if (onSaveStatusChange) onSaveStatusChange(s); }, [onSaveStatusChange]);

  const persistLead = useCallback(() => {
    if (!lead?.id) return;
    setStatus("saving");
    // Update parent state immediately so other pages reflect changes
    if (setLeads) {
      setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...lead } : l));
    }
    updateLead(lead.id, lead)
      .then(() => {
        setStatus("saved");
        if (clearStatusRef.current) clearTimeout(clearStatusRef.current);
        clearStatusRef.current = setTimeout(() => setStatus(null), 2000);
      })
      .catch((err) => {
        console.error("Failed to save lead:", err);
        setStatus("error");
        if (clearStatusRef.current) clearTimeout(clearStatusRef.current);
        clearStatusRef.current = setTimeout(() => setStatus(null), 3000);
      });
  }, [lead, setLeads, setStatus]);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(persistLead, 600);
  }, [persistLead]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (clearStatusRef.current) clearTimeout(clearStatusRef.current);
    };
  }, []);

  const handleAddPartner = async () => {
    if (!partnerValid) return;
    setSavingPartner(true);
    try {
      const newPartner = {
        name: partnerForm.name,
        organization: partnerForm.name,
        type: partnerForm.type,
        contactPerson: partnerForm.contactPerson,
        contactTitle: partnerForm.contactTitle,
        phone: partnerForm.phone,
        email: partnerForm.email,
        notes: partnerForm.notes,
        referredLeadIds: lead?.id ? [lead.id] : [],
        serviceHoursRequested: 0,
        commissionRate: 0,
        totalCommission: 0,
        status: "active",
        lastReferralDate: new Date().toISOString().split("T")[0],
      };
      const saved = await createReferrer(newPartner, organization?.id);
      if (setReferrers) setReferrers((prev) => [...prev, saved]);
      // Link to lead
      lead.referrerId = saved.id;
      lead.referPartner = saved.organization || saved.name;
      lead.referredBy = saved.contactPerson || "";
      setFields((prev) => ({
        ...prev,
        referPartner: saved.organization || saved.name,
        referredBy: saved.contactPerson || "",
      }));
      debouncedSave();
      setAddingPartner(false);
      resetPartnerForm();
      toast({ title: "Partner added", description: `${saved.name} has been added.` });
    } catch (err) {
      console.error("Failed to add partner:", err);
      toast({ title: "Error", description: "Failed to add partner.", variant: "destructive" });
    } finally {
      setSavingPartner(false);
    }
  };

  // State for all fields
  const buildFields = () => ({
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
  });

  const [fields, setFields] = useState(buildFields);

  // Re-initialize when a different lead is opened
  useEffect(() => {
    setFields(buildFields());
    setStatus(null);
  }, [lead?.id]);

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
      case "referPartner": {
        const oldPartnerName = lead.referPartner;
        lead.referPartner = val;
        // Move lead ID between referrers' referredLeadIds
        if (setReferrers && lead.id) {
          setReferrers((prev) => prev.map((r) => {
            const rName = r.organization || r.name;
            const ids = [...(r.referredLeadIds || [])];
            if (rName === oldPartnerName && ids.includes(lead.id)) {
              // Remove from old
              const updated = { ...r, referredLeadIds: ids.filter((id) => id !== lead.id) };
              updateReferrer(r.id, updated).catch(console.error);
              return updated;
            }
            if (rName === val && !ids.includes(lead.id)) {
              // Add to new
              const updated = { ...r, referredLeadIds: [...ids, lead.id] };
              updateReferrer(r.id, updated).catch(console.error);
              return updated;
            }
            return r;
          }));
        }
        break;
      }
      case "referredBy": lead.referredBy = val; break;
      case "careType": lead.careLevel = val; break;
      case "hoursPerDay": lead.hoursPerDay = val; break;
      case "timeline": if (n) n.timeline = val; lead.timeline = val; break;
      case "budget": if (n) n.budgetFinancial = Array.isArray(val) ? val : [val]; lead.budget = Array.isArray(val) ? val.join(". ") : val; break;
      case "personalNotes": lead.personalNotes = val; break;
      default: lead[key] = val; break;
    }
    debouncedSave();
  };

  const updateMulti = (key, val) => {
    const display = Array.isArray(val) && val.length > 0 ? val.join(". ") : (Array.isArray(val) ? "" : val || "");
    setFields((prev) => ({ ...prev, [key]: display }));
    switch (key) {
      case "nextSteps": if (n) n.nextStep = Array.isArray(val) ? val : [val]; break;
      case "preferences": if (n) n.preferences = Array.isArray(val) ? val : [val]; break;
      case "objections": if (n) n.objections = Array.isArray(val) ? val : [val]; break;
    }
    debouncedSave();
  };

  const leadSourceOptions = [
    { value: "Website", label: "Website" },
    { value: "Digital Ads", label: "Digital Ads" },
    { value: "Referral Partner", label: "Referral Partner" },
    { value: "Event", label: "Event" },
    { value: "Phone Call", label: "Phone Call" },
    { value: "Walk-in", label: "Walk-in" },
    { value: "Manual Entry", label: "Manual Entry" },
    { value: "Other", label: "Other" },
  ];

  const showReferral = fields.leadSource === "Referral Partner";

  // Build dropdown options from referrers
  const partnerOptions = useMemo(() => {
    const seen = new Set();
    return referrers.filter((r) => {
      const key = r.organization || r.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((r) => ({
      value: r.organization || r.name,
      label: r.organization || r.name,
      sub: r.type,
    }));
  }, [referrers]);

  // Contact person options based on selected partner
  const contactOptions = useMemo(() => {
    if (!fields.referPartner) return [];
    const names = new Set();
    referrers.forEach((r) => {
      if ((r.organization || r.name) !== fields.referPartner) return;
      if (r.contactPerson) names.add(r.contactPerson);
      if (r.contacts?.length) r.contacts.forEach((c) => { if (c.name) names.add(c.name); });
    });
    return [...names].map((name) => ({ value: name, label: name }));
  }, [referrers, fields.referPartner]);

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
          <InlineSelect label="Lead Source" value={fields.leadSource} options={leadSourceOptions} onSave={(v) => update("leadSource", v)} />
          {showReferral && (
            <>
              <div className="flex items-end gap-1">
                <InlineSelect label="Refer Partner" value={fields.referPartner} options={partnerOptions} onSave={(v) => { update("referPartner", v); if (v !== fields.referPartner) update("referredBy", ""); }} />
                <button
                  onClick={() => setAddingPartner(!addingPartner)}
                  className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors mb-0.5"
                  title="Add new partner"
                >
                  <Plus className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                </button>
              </div>
              <InlineSelect label="Referred by" value={fields.referredBy} options={contactOptions} onSave={(v) => update("referredBy", v)} />
            </>
          )}
        </div>

        {/* Inline Add Partner Form */}
        {showReferral && addingPartner && (
          <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 space-y-2.5 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Add New Partner</span>
              <button onClick={() => { setAddingPartner(false); resetPartnerForm(); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Partner Name *</label>
                <Input value={partnerForm.name} onChange={(e) => setPartner("name", e.target.value)} className="h-7 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Primary Contact Person *</label>
                <Input value={partnerForm.contactPerson} onChange={(e) => setPartner("contactPerson", e.target.value)} className="h-7 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Title</label>
                <Input placeholder="e.g. Case Manager" value={partnerForm.contactTitle} onChange={(e) => setPartner("contactTitle", e.target.value)} className="h-7 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Email *</label>
                <Input type="email" value={partnerForm.email} onChange={(e) => setPartner("email", e.target.value)} className="h-7 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Phone</label>
                <Input value={partnerForm.phone} onChange={(e) => setPartner("phone", e.target.value)} className="h-7 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Partner Type *</label>
                <Select value={partnerForm.type} onValueChange={(v) => setPartner("type", v)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Notes</label>
              <textarea
                placeholder="How we connected, referral preferences..."
                value={partnerForm.notes}
                onChange={(e) => setPartner("notes", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs min-h-[40px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setAddingPartner(false); resetPartnerForm(); }}>Cancel</Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleAddPartner} disabled={!partnerValid || savingPartner}>
                {savingPartner ? "Adding..." : "Add Partner"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* ── Care Needs ── */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Care Needs</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
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

      {/* ── Next Steps ── */}
      <InlineMultiLine label="Next Steps" value={fields.nextSteps} onSave={(v) => updateMulti("nextSteps", v)} />

      <Separator />

      {/* ── Personal Notes ── */}
      <InlineMultiLine label="Personal Notes" value={fields.personalNotes} onSave={(v) => { const text = typeof v === "string" ? v : Array.isArray(v) ? v.join(". ") : ""; update("personalNotes", text); if (n) n.situationSummary = text ? [text] : []; }} sectionType="single" />

      {/* ── Custom Fields ── */}
      {customFields.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Custom Fields</h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {customFields.map((field) => {
              if (field.type === "select") {
                return (
                  <InlineSelect
                    key={field.id}
                    label={field.label}
                    value={lead[field.id] || ""}
                    options={field.options.map((o) => ({ value: o, label: o }))}
                    onSave={(val) => update(field.id, val)}
                  />
                );
              }
              return (
                <InlineField
                  key={field.id}
                  label={field.label}
                  value={lead[field.id] || ""}
                  onSave={(val) => update(field.id, val)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
