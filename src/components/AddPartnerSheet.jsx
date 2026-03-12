import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const referrerTypes = ["Hospital", "Physician", "Social Worker", "Local Communities", "Insurance", "Home Health"];
export default function AddPartnerSheet({ open, onOpenChange, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    type: "",
    contactPerson: "",
    phone: "",
    email: "",
    notes: "",
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const isValid = form.name && form.type && form.contactPerson && form.phone && form.email && form.notes;

  const handleSubmit = () => {
    if (!isValid) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    const newPartner = {
      id: `ref-${Date.now()}`,
      name: form.name,
      type: form.type,
      contactPerson: form.contactPerson,
      phone: form.phone,
      email: form.email,
      notes: form.notes,
      referredLeadIds: [],
      serviceHoursRequested: 0,
      commissionRate: 0,
      totalCommission: 0,
      status: "active",
      lastReferralDate: new Date().toISOString().split("T")[0],
    };
    onAdd(newPartner);
    setForm({ name: "", type: "", contactPerson: "", phone: "", email: "", notes: "" });
    onOpenChange(false);
    toast({ title: "Partner added", description: `${newPartner.name} has been added successfully.` });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Referral Partner</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label className="text-xs">Partner Name *</Label>
            <Input placeholder="e.g. Valley Medical Center" value={form.name} onChange={e => update("name", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Type *</Label>
            <Select value={form.type} onValueChange={v => update("type", v)}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {referrerTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Contact Person *</Label>
            <Input placeholder="e.g. Dr. Patel" value={form.contactPerson} onChange={e => update("contactPerson", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Phone *</Label>
            <Input placeholder="(310) 555-0000" value={form.phone} onChange={e => update("phone", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Email *</Label>
            <Input type="email" placeholder="contact@partner.com" value={form.email} onChange={e => update("email", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes *</Label>
            <Textarea placeholder="Partnership details, referral patterns, etc." value={form.notes} onChange={e => update("notes", e.target.value)} rows={3} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!isValid}>Add Partner</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
