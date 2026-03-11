import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Clock } from "lucide-react";

export default function CallDialog({ open, onOpenChange, name, phone }) {
  const [status, setStatus] = useState("ringing");
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) {
      setStatus("ringing");
      setMuted(false);
      setSpeakerOn(false);
      setElapsed(0);
      return;
    }
    const timer = setTimeout(() => setStatus("connected"), 2000);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (status !== "connected") return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleEnd = () => {
    setStatus("ended");
    setTimeout(() => onOpenChange(false), 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="text-lg">{name}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">{phone}</p>

        <div className="flex items-center justify-center gap-2 py-2">
          {status === "ringing" && (
            <span className="text-sm text-warning animate-pulse flex items-center gap-1.5">
              <Phone className="h-4 w-4" /> Ringing…
            </span>
          )}
          {status === "connected" && (
            <span className="text-sm text-success flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {formatTime(elapsed)}
            </span>
          )}
          {status === "ended" && (
            <span className="text-sm text-destructive">Call ended</span>
          )}
        </div>

        {status === "connected" && (
          <div className="flex items-center justify-center gap-3 pb-2">
            <Button
              variant={muted ? "destructive" : "outline"}
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setMuted(!muted)}
            >
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              variant={speakerOn ? "secondary" : "outline"}
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setSpeakerOn(!speakerOn)}
            >
              {speakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        )}

        <Button
          variant="destructive"
          className="w-full rounded-full"
          onClick={handleEnd}
          disabled={status === "ended"}
        >
          <PhoneOff className="h-4 w-4 mr-2" />
          {status === "ringing" ? "Cancel" : "End Call"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
