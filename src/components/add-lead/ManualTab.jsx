import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createReferrer } from "@/services/supabaseReferrers";
import { toast } from "@/hooks/use-toast";

const partnerTypes = [
  "Social Worker / Case Manager",
  "Hospital / Discharge Planner",
  "Physician / Clinician",
  "Home Health / Hospice",
  "Paid Network",
  "Placement Specialist",
  "Family / Friend",
  "Current Resident",
  "Insurance / LTC Specialist",
  "Financial Advisor / Wealth Manager",
  "Community Organization / Non-profit",
  "Other",
];

const initialForm = {
  name: "",
  dateOfBirth: "",
  gender: "",
  contactPerson: "",
  contactPhone: "",
  contactEmail: "",
  zipcode: "",
  relationship: "",
  careType: "",
  hoursPerDay: "",
  timeline: "",
  budget: "",
  source: "",
  sourceOther: "",
  referrerId: "",
  referredBy: "",
  referPartner: "",
  notes: "",
};

export default function ManualTab({ onLeadCreated, referrers = [], onReferrerAdded, aiPrefill, isProcessing, customFields = [], stages = [] }) {
  const { user, organization } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email || "Unknown";
  const [form, setForm] = useState(initialForm);

  // Apply AI prefill when it arrives
  useEffect(() => {
    if (aiPrefill) {
      setForm((prev) => {
        const merged = { ...prev };
        Object.keys(aiPrefill).forEach((key) => {
          const val = aiPrefill[key];
          if (val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0)) {
            merged[key] = val;
          }
        });
        return merged;
      });
    }
  }, [aiPrefill]);
  const [addingPartner, setAddingPartner] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    name: "", contactPerson: "", contactTitle: "", email: "", phone: "", type: "", notes: "",
  });
  const [savingPartner, setSavingPartner] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setPartner = (field, value) => setPartnerForm((f) => ({ ...f, [field]: value }));

  // Group referrers by organization for the dropdown
  const orgGroups = useMemo(() => {
    const map = new Map(); // orgName → referrer[]
    referrers.forEach((r) => {
      const org = r.organization || r.name;
      if (!map.has(org)) map.set(org, []);
      map.get(org).push(r);
    });
    return map;
  }, [referrers]);

  const uniqueOrgs = useMemo(() => [...orgGroups.keys()].sort(), [orgGroups]);

  // Get contact persons for the selected org
  const selectedOrgReferrers = useMemo(() => {
    if (!form.referPartner) return [];
    return orgGroups.get(form.referPartner) || [];
  }, [form.referPartner, orgGroups]);

  const contactPersonOptions = useMemo(() => {
    return selectedOrgReferrers.map((r) => ({
      id: r.id,
      name: r.contactPerson,
    })).filter((c) => c.name);
  }, [selectedOrgReferrers]);

  const partnerValid = partnerForm.name && partnerForm.contactPerson && partnerForm.email && partnerForm.type;

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
        referredLeadIds: [],
        totalContractValue: 0,
        status: "active",
        lastReferralDate: new Date().toISOString().split("T")[0],
      };
      const saved = await createReferrer(newPartner, organization?.id);
      onReferrerAdded?.(saved);
      set("referrerId", saved.id);
      set("referPartner", saved.organization || saved.name);
      set("referredBy", saved.contactPerson || "");
      setAddingPartner(false);
      setPartnerForm({ name: "", contactPerson: "", contactTitle: "", email: "", phone: "", type: "", notes: "" });
      toast({ title: "Partner added", description: `${saved.name} has been added.` });
    } catch (err) {
      console.error("Failed to add partner:", err);
      toast({ title: "Error", description: "Failed to add partner.", variant: "destructive" });
    } finally {
      setSavingPartner(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleString();

    const lead = {
      id: `manual-lead-${Date.now()}`,
      name: form.name || "Unknown",
      dateOfBirth: form.dateOfBirth || "",
      gender: form.gender || "",
      contactPerson: form.contactPerson || form.name || "Unknown",
      contactRelation: form.relationship || "",
      contactPhone: form.contactPhone || "",
      contactEmail: form.contactEmail || "",
      careLevel: form.careType || "",
      hoursPerDay: form.hoursPerDay || "",
      lastContactDate: dateStr,
      facility: "",
      stage: stages[0]?.key || "inquiry",
      score: "cold",
      source: form.source || "Website",
      referrerId: form.source === "Referral" ? form.referrerId || null : null,
      referredBy: form.source === "Referral" ? form.referredBy || "" : "",
      referPartner: form.source === "Referral" ? form.referPartner || "" : "",
      inquiryDate: dateStr,
      initialContact: dateStr,
      nextActivity: "Follow-up call scheduled",
      salesRep: userName,
      budget: form.budget || "",
      timeline: form.timeline || "",
      intakeNote: {
        leadSource: form.source || "Website",
        zipcode: form.zipcode || "",
        caller: `${form.contactPerson || form.name}`,
        dateTime: timeStr,
        salesRep: userName,
        situationSummary: form.notes ? [form.notes] : [],
        careNeeds: form.careType ? [`${form.careType} care needed`] : [],

        budgetFinancial: form.budget ? [form.budget] : [],
        decisionMakers: form.contactPerson || form.name ? [form.contactPerson || form.name] : [],
        timeline: form.timeline || "",
        preferences: [],
        objections: [],
        salesRepAssessment: [],
        nextStep: [],
      },
      interactions: [],
      callTranscripts: [],
    };

    onLeadCreated(lead, { autoOpen: false });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset disabled={isProcessing} className={`space-y-4 ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Row 1: Client Name, Date of Birth, Sex */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Client Name</Label>
          <Input className="h-9 text-sm" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Date of Birth</Label>
          <Input className="h-9 text-sm" placeholder="e.g. 01/15/1945" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Sex</Label>
          <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Contact Person, Relationship to Client */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Contact Person</Label>
          <Input className="h-9 text-sm" value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Relationship to Prospect</Label>
          <Select value={form.relationship} onValueChange={(v) => set("relationship", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Self">Self</SelectItem>
              <SelectItem value="Daughter">Daughter</SelectItem>
              <SelectItem value="Son">Son</SelectItem>
              <SelectItem value="Sister">Sister</SelectItem>
              <SelectItem value="Brother">Brother</SelectItem>
              <SelectItem value="Spouse">Spouse</SelectItem>
              <SelectItem value="Relative">Relative</SelectItem>
              <SelectItem value="Hospital / Social Worker">Hospital / Social Worker</SelectItem>
              <SelectItem value="Care Manager">Care Manager</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: Phone, Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Phone</Label>
          <Input className="h-9 text-sm" type="tel" placeholder="(555) 123-4567" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <Input className="h-9 text-sm" type="email" placeholder="email@example.com" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </div>
      </div>

      {/* Row 3b: Zipcode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Zip Code</Label>
          <Input className="h-9 text-sm" value={form.zipcode} onChange={(e) => set("zipcode", e.target.value)} />
        </div>
      </div>

      {/* Type of Care */}
      <div className="space-y-1.5">
        <Label className="text-xs">Type of Care</Label>
        <Select value={form.careType} onValueChange={(v) => set("careType", v)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select type of care" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Assisted Living">Assisted Living</SelectItem>
            <SelectItem value="Independent Living">Independent Living</SelectItem>
            <SelectItem value="Memory Care">Memory Care</SelectItem>
            <SelectItem value="Skilled Nursing">Skilled Nursing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Row 5: Timeline, Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Timeline</Label>
          <Input className="h-9 text-sm" placeholder="e.g. Immediately, Within a week" value={form.timeline} onChange={(e) => set("timeline", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Budget</Label>
          <Input className="h-9 text-sm" placeholder="e.g. $50/hr" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
        </div>
      </div>

      {/* Row 6: Lead Source + conditional fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Lead Source</Label>
          <Select value={form.source} onValueChange={(v) => set("source", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Digital Ads">Digital Ads</SelectItem>
              <SelectItem value="Website">Website</SelectItem>
              <SelectItem value="Phone Call">Phone Call</SelectItem>
              <SelectItem value="Walk-in">Walk-in</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
              <SelectItem value="Event">Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.source === "Referral" && !addingPartner && (
          <div className="space-y-1.5">
            <Label className="text-xs">Referral Partner</Label>
            <div className="flex items-center gap-2">
              <Select value={form.referPartner || ""} onValueChange={(v) => {
                set("referPartner", v);
                set("referrerId", "");
                set("referredBy", "");
                // Auto-select if only one contact at this org
                const orgRefs = orgGroups.get(v) || [];
                if (orgRefs.length === 1) {
                  set("referrerId", orgRefs[0].id);
                  set("referredBy", orgRefs[0].contactPerson || "");
                }
              }}>
                <SelectTrigger className="h-9 text-sm flex-1">
                  <SelectValue placeholder="Select partner" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueOrgs.map((org) => (
                    <SelectItem key={org} value={org}>{org}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => setAddingPartner(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        {form.source === "Referral" && !addingPartner && form.referPartner && contactPersonOptions.length > 1 && (
          <div className="space-y-1.5">
            <Label className="text-xs">Referred By (Contact Person)</Label>
            <Select value={form.referrerId} onValueChange={(v) => {
              set("referrerId", v);
              const ref = referrers.find((r) => r.id === v);
              if (ref) set("referredBy", ref.contactPerson || "");
            }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select contact person" />
              </SelectTrigger>
              <SelectContent>
                {contactPersonOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Inline Add Partner Form */}
      {form.source === "Referral" && addingPartner && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Add New Partner</Label>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAddingPartner(false)}>Cancel</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Partner Name *</Label>
              <Input className="h-9 text-sm" value={partnerForm.name} onChange={(e) => setPartner("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Primary Contact Person *</Label>
              <Input className="h-9 text-sm" value={partnerForm.contactPerson} onChange={(e) => setPartner("contactPerson", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input placeholder="e.g. Case Manager, Director of Nursing" className="h-9 text-sm" value={partnerForm.contactTitle} onChange={(e) => setPartner("contactTitle", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input type="email" className="h-9 text-sm" value={partnerForm.email} onChange={(e) => setPartner("email", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input className="h-9 text-sm" value={partnerForm.phone} onChange={(e) => setPartner("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Partner Type *</Label>
              <Select value={partnerForm.type} onValueChange={(v) => setPartner("type", v)}>
                <SelectTrigger className="h-9 text-sm">
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
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea placeholder="How we connected, referral preferences..." className="text-sm min-h-[60px]" value={partnerForm.notes} onChange={(e) => setPartner("notes", e.target.value)} />
          </div>
          <Button type="button" size="sm" onClick={handleAddPartner} disabled={!partnerValid || savingPartner}>
            {savingPartner ? "Adding..." : "Add Partner"}
          </Button>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Textarea placeholder="Caregiver preference, family dynamics, decision makers, concerns..." className="text-sm min-h-[80px]" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      {/* Custom Fields */}
      {customFields.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-border">
          <h4 className="text-sm font-medium text-foreground">Additional Fields</h4>
          {customFields.map((field) => (
            <div key={field.id}>
              <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
              {field.type === "select" ? (
                <select
                  value={form[field.id] || ""}
                  onChange={(e) => set(field.id, e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">Select...</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <Input
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                  value={form[field.id] || ""}
                  onChange={(e) => set(field.id, e.target.value)}
                  placeholder={field.label}
                />
              )}
            </div>
          ))}
        </div>
      )}

      </fieldset>

      <Button type="submit" className="w-full" size="sm" disabled={isProcessing}>
        Add Lead
      </Button>
    </form>
  );
}
