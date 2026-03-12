import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const referrerTypes = ["Hospital", "Physician", "Social Worker", "Local Communities", "Insurance", "Home Health"];

export default function AddPartnerSheet({ open, onOpenChange, onAdd, referrers = [] }) {
  const [form, setForm] = useState({
    name: "",
    organization: "",
    type: "",
    contactPerson: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [addingNewOrg, setAddingNewOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  const existingOrgs = useMemo(() => {
    const orgs = referrers.map((r) => r.organization).filter(Boolean);
    return [...new Set(orgs)].sort();
  }, [referrers]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const isValid = form.name && form.organization && form.type && form.contactPerson && form.phone && form.email && form.notes;

  const handleSubmit = () => {
    if (!isValid) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    const newPartner = {
      id: `ref-${Date.now()}`,
      name: form.name,
      organization: form.organization,
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
    setForm({ name: "", organization: "", type: "", contactPerson: "", phone: "", email: "", notes: "" });
    setAddingNewOrg(false);
    setNewOrgName("");
    onOpenChange(false);
    toast({ title: "Partner added", description: `${newPartner.name} has been added successfully.` });
  };

  const handleAddNewOrg = () => {
    if (!newOrgName.trim()) return;
    update("organization", newOrgName.trim());
    setAddingNewOrg(false);
    setNewOrgName("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Referral Partner</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label className="text-xs">Organization *</Label>
            {addingNewOrg ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="New organization name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  autoFocus
                />
                <Button size="sm" onClick={handleAddNewOrg} disabled={!newOrgName.trim()}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingNewOrg(false); setNewOrgName(""); }}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={form.organization} onValueChange={v => update("organization", v)} className="flex-1">
                  <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                  <SelectContent>
                    {existingOrgs.map(org => <SelectItem key={org} value={org}>{org}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => setAddingNewOrg(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            {form.organization && !addingNewOrg && (
              <p className="text-[11px] text-primary font-medium">{form.organization}</p>
            )}
          </div>

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
