import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { createReferrer } from "@/services/supabaseReferrers";
import { toast } from "@/hooks/use-toast";

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

const initialForm = {
  name: "",
  age: "",
  contactPerson: "",
  contactPhone: "",
  contactEmail: "",
  zipcode: "",
  relationship: "",
  careType: [],
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

export default function ManualTab({ onLeadCreated, referrers = [], onReferrerAdded, aiPrefill, isProcessing }) {
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
        serviceHoursRequested: 0,
        commissionRate: 0,
        totalCommission: 0,
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
      age: form.age || "",
      contactPerson: form.contactPerson || form.name || "Unknown",
      contactRelation: form.relationship || "",
      contactPhone: form.contactPhone || "",
      contactEmail: form.contactEmail || "",
      careLevel: form.careType.length > 0 ? form.careType.join(", ") : "Not Sure Yet",
      hoursPerDay: form.hoursPerDay || "",
      lastContactDate: dateStr,
      facility: "",
      stage: "inquiry",
      score: "cold",
      source: form.source === "Other" ? (form.sourceOther || "Other") : (form.source || "Website"),
      referrerId: form.source === "Referral Partner" ? form.referrerId || null : null,
      referredBy: form.source === "Referral Partner" ? form.referredBy || "" : "",
      referPartner: form.source === "Referral Partner" ? form.referPartner || "" : "",
      inquiryDate: dateStr,
      initialContact: dateStr,
      nextActivity: "Follow-up call scheduled",
      salesRep: userName,
      budget: form.budget || "",
      timeline: form.timeline || "",
      intakeNote: {
        leadSource: form.source === "Other" ? (form.sourceOther || "Other") : (form.source || "Manual Entry"),
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
      {/* Row 1: Client Name, Age */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Client Name</Label>
          <Input className="h-9 text-sm" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Age</Label>
          <Input type="number" className="h-9 text-sm" value={form.age} onChange={(e) => set("age", e.target.value)} />
        </div>
      </div>

      {/* Row 2: Contact Person, Relationship to Client */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Contact Person</Label>
          <Input className="h-9 text-sm" value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Relationship to Client</Label>
          <Select value={form.relationship} onValueChange={(v) => set("relationship", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Self">Self</SelectItem>
              <SelectItem value="Daughter / Son">Daughter / Son</SelectItem>
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

      {/* Type of Care (checkboxes) */}
      <div className="space-y-1.5">
        <Label className="text-xs">Type of Care</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {["ADL Support", "Assisted Living", "Post-Acute", "Companionship", "Not Sure Yet"].map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={form.careType.includes(type)}
                onCheckedChange={(checked) => {
                  set("careType", checked
                    ? [...form.careType, type]
                    : form.careType.filter((t) => t !== type)
                  );
                }}
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      {/* Hours of Care / Week */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Hours of Care / Week</Label>
          <Input className="h-9 text-sm" placeholder="e.g. 20 hours" value={form.hoursPerDay} onChange={(e) => set("hoursPerDay", e.target.value)} />
        </div>
      </div>

      {/* Row 5: Timeline, Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Timeline</Label>
          <Select value={form.timeline} onValueChange={(v) => set("timeline", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select timeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Immediately">Immediately</SelectItem>
              <SelectItem value="Within a few days">Within a few days</SelectItem>
              <SelectItem value="Within a week">Within a week</SelectItem>
              <SelectItem value="Within a month">Within a month</SelectItem>
              <SelectItem value="More than a month">More than a month</SelectItem>
              <SelectItem value="Just researching">Just researching</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Budget Expectation</Label>
          <Select value={form.budget} onValueChange={(v) => set("budget", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Under $40/hr">Under $40/hr</SelectItem>
              <SelectItem value="$40–60/hr">$40–60/hr</SelectItem>
              <SelectItem value="$60+/hr">$60+/hr</SelectItem>
              <SelectItem value="Not sure">Not sure</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 6: Lead Source + conditional fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Lead Source</Label>
          <Select value={form.source} onValueChange={(v) => { set("source", v); if (v !== "Other") set("sourceOther", ""); }}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Website">Website</SelectItem>
              <SelectItem value="Digital Ads">Digital Ads</SelectItem>
              <SelectItem value="Referral Partner">Referral Partner</SelectItem>
              <SelectItem value="Event">Event</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.source === "Referral Partner" && !addingPartner && (
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
        {form.source === "Referral Partner" && !addingPartner && form.referPartner && contactPersonOptions.length > 1 && (
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
        {form.source === "Other" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Specify Source</Label>
            <Input className="h-9 text-sm" value={form.sourceOther} onChange={(e) => set("sourceOther", e.target.value)} />
          </div>
        )}
      </div>

      {/* Inline Add Partner Form */}
      {form.source === "Referral Partner" && addingPartner && (
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
              <Input className="h-9 text-sm" value={partnerForm.contactTitle} onChange={(e) => setPartner("contactTitle", e.target.value)} />
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
            <Textarea className="text-sm min-h-[60px]" value={partnerForm.notes} onChange={(e) => setPartner("notes", e.target.value)} />
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

      </fieldset>

      <Button type="submit" className="w-full" size="sm" disabled={isProcessing}>
        Add Lead
      </Button>
    </form>
  );
}
