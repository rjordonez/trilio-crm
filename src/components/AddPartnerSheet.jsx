import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const referrerTypes = ["Hospital", "Physician", "Social Worker", "Local Communities", "Insurance", "Home Health"];
const scoreOptions = ["hot", "warm", "cold", "nurture"];

export default function AddPartnerSheet({ open, onOpenChange, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    organization: "",
    type: "",
    contactPerson: "",
    phone: "",
    email: "",
    score: "",
    notes: "",
  });
  const [activeVoiceField, setActiveVoiceField] = useState(null);
  const [recognition, setRecognition] = useState(null);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const startVoice = (field) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Voice not supported", description: "Your browser doesn't support speech recognition.", variant: "destructive" });
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      update(field, (form[field] + " " + transcript).trim());
      setActiveVoiceField(null);
    };
    rec.onerror = () => {
      setActiveVoiceField(null);
      toast({ title: "Voice error", description: "Could not capture audio. Please try again.", variant: "destructive" });
    };
    rec.onend = () => setActiveVoiceField(null);
    setRecognition(rec);
    setActiveVoiceField(field);
    rec.start();
  };

  const stopVoice = () => {
    if (recognition) recognition.stop();
    setActiveVoiceField(null);
  };

  const isValid = form.name && form.organization && form.type && form.contactPerson && form.phone && form.email && form.score && form.notes;

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
      score: form.score,
      notes: form.notes,
      referredLeadIds: [],
      serviceHoursRequested: 0,
      commissionRate: 0,
      totalCommission: 0,
      status: "active",
      lastReferralDate: new Date().toISOString().split("T")[0],
    };
    onAdd(newPartner);
    setForm({ name: "", organization: "", type: "", contactPerson: "", phone: "", email: "", score: "", notes: "" });
    onOpenChange(false);
    toast({ title: "Partner added", description: `${newPartner.name} has been added successfully.` });
  };

  const VoiceButton = ({ field }) => {
    const isActive = activeVoiceField === field;
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`h-7 w-7 shrink-0 ${isActive ? "text-destructive" : "text-muted-foreground"}`}
        onClick={() => isActive ? stopVoice() : startVoice(field)}
      >
        {isActive ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      </Button>
    );
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
            <div className="flex items-center gap-1">
              <Input placeholder="e.g. Valley Medical Center" value={form.name} onChange={e => update("name", e.target.value)} />
              <VoiceButton field="name" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Organization *</Label>
            <div className="flex items-center gap-1">
              <Input placeholder="e.g. Valley Medical Group" value={form.organization} onChange={e => update("organization", e.target.value)} />
              <VoiceButton field="organization" />
            </div>
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
            <div className="flex items-center gap-1">
              <Input placeholder="e.g. Dr. Patel" value={form.contactPerson} onChange={e => update("contactPerson", e.target.value)} />
              <VoiceButton field="contactPerson" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Phone *</Label>
            <div className="flex items-center gap-1">
              <Input placeholder="(310) 555-0000" value={form.phone} onChange={e => update("phone", e.target.value)} />
              <VoiceButton field="phone" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Email *</Label>
            <div className="flex items-center gap-1">
              <Input type="email" placeholder="contact@partner.com" value={form.email} onChange={e => update("email", e.target.value)} />
              <VoiceButton field="email" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Score *</Label>
            <Select value={form.score} onValueChange={v => update("score", v)}>
              <SelectTrigger><SelectValue placeholder="Select score" /></SelectTrigger>
              <SelectContent>
                {scoreOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes *</Label>
            <div className="flex items-start gap-1">
              <Textarea placeholder="Partnership details, referral patterns, etc." value={form.notes} onChange={e => update("notes", e.target.value)} rows={3} />
              <VoiceButton field="notes" />
            </div>
          </div>

          {activeVoiceField && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
              <span className="text-xs text-destructive font-medium">Listening for &quot;{activeVoiceField}&quot;... Click mic to stop</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!isValid}>Add Partner</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
