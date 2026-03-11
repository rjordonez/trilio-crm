import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function EmailComposeDialog({ open, onOpenChange, name, email }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast({ title: "Email sent", description: `Email sent to ${name} (${email})` });
      setSubject("");
      setBody("");
      onOpenChange(false);
    }, 1000);
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
            <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()}>
              <Send className="h-4 w-4 mr-1.5" />
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
