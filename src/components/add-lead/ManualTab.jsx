import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const initialForm = {
  name: "",
  contactPerson: "",
  contactInfo: "",
  zipcode: "",
  careType: "",
  source: "",
  score: "",
  decisionMakers: "",
  notes: "",
  budget: "",
  timeline: "",
};

export default function ManualTab({ onLeadCreated }) {
  const [form, setForm] = useState(initialForm);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleString();

    const lead = {
      id: `manual-lead-${Date.now()}`,
      name: form.name || "Unknown",
      contactPerson: form.contactPerson || form.name || "Unknown",
      contactRelation: "",
      contactPhone: form.contactInfo?.includes("@") ? "" : form.contactInfo || "",
      contactEmail: form.contactInfo?.includes("@") ? form.contactInfo : "",
      careLevel: form.careType || "Assisted Living",
      lastContactDate: dateStr,
      facility: "Sunrise Gardens",
      stage: "inquiry",
      score: form.score || "cold",
      source: form.source || "Phone Call",
      inquiryDate: dateStr,
      initialContact: dateStr,
      nextActivity: "Follow-up call scheduled",
      salesRep: "Alex Rivera",
      intakeNote: {
        leadSource: form.source || "Manual Entry",
        zipcode: form.zipcode || "",
        caller: `${form.contactPerson || form.name}`,
        dateTime: timeStr,
        salesRep: "Alex Rivera",
        situationSummary: form.notes ? [form.notes] : ["No notes provided"],
        careNeeds: form.careType ? [`${form.careType} care needed`] : ["To be assessed"],
        budgetFinancial: form.budget ? [form.budget] : ["Budget to be discussed"],
        decisionMakers: form.decisionMakers
          ? form.decisionMakers.split(',').map(s => s.trim()).filter(Boolean)
          : [form.contactPerson || form.name || "Unknown"],
        timeline: form.timeline || "To be determined",
        preferences: ["No preferences recorded yet"],
        objections: [],
        salesRepAssessment: ["Manually entered lead", "Requires initial assessment"],
        nextStep: ["Schedule initial call", "Complete intake assessment"],
      },
      interactions: [],
      callTranscripts: [],
    };

    onLeadCreated(lead, { autoOpen: false });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Prospect Name</Label>
          <Input placeholder="e.g. Margaret Chen" className="h-9 text-sm" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Contact Person</Label>
          <Input placeholder="e.g. Lisa Chen" className="h-9 text-sm" value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Contact</Label>
          <Input placeholder="e.g. (555) 123-4567 or email@example.com" className="h-9 text-sm" value={form.contactInfo} onChange={(e) => set("contactInfo", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Zipcode</Label>
          <Input placeholder="e.g. 90007" className="h-9 text-sm" value={form.zipcode} onChange={(e) => set("zipcode", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Care Type</Label>
          <Select value={form.careType} onValueChange={(v) => set("careType", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select care type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Assisted Living">Assisted Living</SelectItem>
              <SelectItem value="Independent Living">Independent Living</SelectItem>
              <SelectItem value="Memory Care">Memory Care</SelectItem>
              <SelectItem value="Skilled Nursing">Skilled Nursing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Source</Label>
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
        <div className="space-y-1.5">
          <Label className="text-xs">Lead Score</Label>
          <Select value={form.score} onValueChange={(v) => set("score", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="nurture">Nurture</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Decision Makers</Label>
        <Input placeholder="e.g. Lisa Chen (daughter), John Chen (son)" className="h-9 text-sm" value={form.decisionMakers} onChange={(e) => set("decisionMakers", e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Budget Range</Label>
          <Input placeholder="e.g. $4,000-$6,000/mo" className="h-9 text-sm" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Timeline</Label>
          <Input placeholder="e.g. Within 2 months" className="h-9 text-sm" value={form.timeline} onChange={(e) => set("timeline", e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Textarea placeholder="Situation summary, concerns, objections, or any other notes..." className="text-sm min-h-[80px]" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <Button type="submit" className="w-full" size="sm">
        Add Lead
      </Button>
    </form>
  );
}
