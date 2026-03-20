import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { supabase } from "@/lib/supabase";
import { defaultTemplates, personalizeContent } from "@/data/emailTemplates";

export default function EmailComposeDialog({ open, onOpenChange, name, email, lead, onEmailSent }) {
  const { gmailConnected, user } = useAuth();
  const senderName = user?.user_metadata?.full_name || user?.email || "";
  const { navigate } = useNavigation();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;

    const template = defaultTemplates.find((t) => t.id === templateId);
    if (!template) return;

    if (lead) {
      setSubject(personalizeContent(template.subject, lead, senderName));
      setBody(personalizeContent(template.body, lead, senderName));
    } else {
      // Basic merge: just replace name
      let s = template.subject.replace(/\{\{name\}\}/g, name || "").replace(/\{\{contact_person\}\}/g, name || "");
      let b = template.body.replace(/\{\{name\}\}/g, name || "").replace(/\{\{contact_person\}\}/g, name || "");
      s = s.replace(/\{\{sender_name\}\}/g, senderName);
      b = b.replace(/\{\{sender_name\}\}/g, senderName);
      setSubject(s);
      setBody(b);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;

    if (!gmailConnected) {
      toast({
        title: "Gmail not connected",
        description: "Go to Integrations to connect your Gmail account.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/gmail-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ to: email, subject, body }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send");
      }

      toast({ title: "Email sent", description: `Email sent to ${name} (${email})` });
      setSubject("");
      setBody("");
      setSelectedTemplate("");
      onOpenChange(false);
      if (onEmailSent) onEmailSent({ to: email, subject });
    } catch (err) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Compose Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-10 shrink-0">To:</span>
            <span className="text-foreground font-medium">{name} &lt;{email}&gt;</span>
          </div>

          {/* Template selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-10 shrink-0">Tpl:</span>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="flex-1 text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground"
            >
              <option value="">No template</option>
              {defaultTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-10 shrink-0">Subj:</span>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1"
            />
          </div>

          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            className="min-h-[180px]"
          />

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4 mr-1.5" /> Attach
            </Button>
            <div className="flex items-center gap-2">
              {!gmailConnected && (
                <button
                  onClick={() => { onOpenChange(false); navigate('integrations'); }}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Link2 className="h-3 w-3" /> Connect Gmail to send
                </button>
              )}
              <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim() || !gmailConnected}>
                <Send className="h-4 w-4 mr-1.5" />
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
