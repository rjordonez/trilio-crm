import { useState } from "react";
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
  contactInfo: "",
  zipcode: "",
  relationship: "",
  careType: "",
  hoursPerDay: "",
  timeline: "",
  budget: "",
  source: "",
  sourceOther: "",
  referrerId: "",
  notes: "",
};

export default function ManualTab({ onLeadCreated, referrers = [], onReferrerAdded }) {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email || "Unknown";
  const [form, setForm] = useState(initialForm);
  const [addingPartner, setAddingPartner] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    name: "", contactPerson: "", contactTitle: "", email: "", phone: "", type: "", notes: "",
  });
  const [savingPartner, setSavingPartner] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setPartner = (field, value) => setPartnerForm((f) => ({ ...f, [field]: value }));

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
      const saved = await createReferrer(newPartner);
      onReferrerAdded?.(saved);
      set("referrerId", saved.id);
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
      contactPhone: form.contactInfo?.includes("@") ? "" : form.contactInfo || "",
      contactEmail: form.contactInfo?.includes("@") ? form.contactInfo : "",
      careLevel: form.careType || "Not Sure Yet",
      hoursPerDay: form.hoursPerDay || "",
      lastContactDate: dateStr,
      facility: "",
      stage: "inquiry",
      score: "cold",
      source: form.source === "Other" ? (form.sourceOther || "Other") : (form.source || "Website"),
      referrerId: form.source === "Referral Partner" ? form.referrerId || null : null,
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
      {/* Row 1: Patient Name, Patient Age */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Patient Name</Label>
          <Input className="h-9 text-sm" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Patient Age</Label>
          <Input type="number" className="h-9 text-sm" value={form.age} onChange={(e) => set("age", e.target.value)} />
        </div>
      </div>

      {/* Row 2: Contact Person, Relationship to Patient */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Contact Person</Label>
          <Input className="h-9 text-sm" value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Relationship to Patient</Label>
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
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: Contact, Zipcode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Contact (Phone / Email)</Label>
          <Input className="h-9 text-sm" value={form.contactInfo} onChange={(e) => set("contactInfo", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Zip Code</Label>
          <Input className="h-9 text-sm" value={form.zipcode} onChange={(e) => set("zipcode", e.target.value)} />
        </div>
      </div>

      {/* Row 4: Type of Care, Hours of Care / Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Type of Care</Label>
          <Select value={form.careType} onValueChange={(v) => set("careType", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select type of care" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Companion Care">Companion Care</SelectItem>
              <SelectItem value="Personal Care">Personal Care</SelectItem>
              <SelectItem value="Dementia / Alzheimer's">Dementia / Alzheimer's</SelectItem>
              <SelectItem value="Post-Hospital Recovery">Post-Hospital Recovery</SelectItem>
              <SelectItem value="24-Hour Care">24-Hour Care</SelectItem>
              <SelectItem value="Not Sure Yet">Not Sure Yet</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Hours of Care / Day</Label>
          <Select value={form.hoursPerDay} onValueChange={(v) => set("hoursPerDay", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select hours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Less than 4 hours">Less than 4 hours</SelectItem>
              <SelectItem value="4–6 hours">4–6 hours</SelectItem>
              <SelectItem value="8–12 hours">8–12 hours</SelectItem>
              <SelectItem value="Overnight">Overnight</SelectItem>
              <SelectItem value="24 hour">24 hour</SelectItem>
              <SelectItem value="Not sure">Not sure</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem value="Under $30/hr">Under $30/hr</SelectItem>
              <SelectItem value="$30–40/hr">$30–40/hr</SelectItem>
              <SelectItem value="$40–50/hr">$40–50/hr</SelectItem>
              <SelectItem value="$50+/hr">$50+/hr</SelectItem>
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
              <SelectItem value="Existing Client Referral">Existing Client Referral</SelectItem>
              <SelectItem value="Event">Event</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.source === "Referral Partner" && !addingPartner && (
          <div className="space-y-1.5">
            <Label className="text-xs">Referral Partner</Label>
            <div className="flex items-center gap-2">
              <Select value={form.referrerId} onValueChange={(v) => set("referrerId", v)}>
                <SelectTrigger className="h-9 text-sm flex-1">
                  <SelectValue placeholder="Select partner" />
                </SelectTrigger>
                <SelectContent>
                  {referrers.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => setAddingPartner(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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

      <Button type="submit" className="w-full" size="sm">
        Add Lead
      </Button>
    </form>
  );
}
