import { useState, useCallback, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Upload, X, Loader2, FileAudio, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { transcribeAudio } from "@/services/speechToText";
import ManualTab from "@/components/add-lead/ManualTab";

export default function AddLeadDialog({ open, onOpenChange, onLeadCreated, isMobile, referrers = [], onReferrerAdded, customFields = [] }) {
  const [resetKey, setResetKey] = useState(0);

  // Audio import state
  const [importMode, setImportMode] = useState(false); // shows upload area
  const [audioFile, setAudioFile] = useState(null);
  const [contextText, setContextText] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(""); // transcribing | analyzing
  const [aiPrefill, setAiPrefill] = useState(null);
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

  const resetImport = useCallback(() => {
    setImportMode(false);
    setAudioFile(null);
    setContextText("");
    setShowContext(false);
    setProcessing(false);
    setProcessingStep("");
  }, []);

  const handleOpenChange = useCallback((newOpen) => {
    if (!newOpen) {
      // Abort any in-progress processing
      if (abortRef.current) {
        abortRef.current.aborted = true;
        abortRef.current = null;
      }
      setResetKey((k) => k + 1);
      resetImport();
      setAiPrefill(null);
    }
    onOpenChange(newOpen);
  }, [onOpenChange, resetImport]);

  const handleLeadCreated = useCallback((lead, opts) => {
    onLeadCreated?.(lead, opts);
    handleOpenChange(false);
  }, [onLeadCreated, handleOpenChange]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast({ title: "Invalid file", description: "Please upload an audio file.", variant: "destructive" });
      return;
    }
    setAudioFile(file);
    setShowContext(true);
  };

  const handleProcess = useCallback(async (skipContext) => {
    if (!audioFile) return;
    const session = { aborted: false };
    abortRef.current = session;

    setShowContext(false);
    setProcessing(true);
    setProcessingStep("transcribing");

    try {
      // Step 1: Transcribe
      const result = await transcribeAudio(audioFile);
      if (session.aborted) return;

      setProcessingStep("analyzing");

      // Step 2: Analyze with AI
      const context = skipContext ? "" : contextText.trim();
      const response = await fetch("/api/analyze-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcription: result.transcription, context }),
      });

      if (session.aborted) return;

      if (!response.ok) {
        throw new Error("AI analysis failed");
      }

      const leadData = await response.json();
      if (session.aborted) return;

      setAiPrefill(leadData);
      setProcessing(false);
      setProcessingStep("");
      setImportMode(false);
      toast({ title: "AI autofill complete", description: "Review the form and make any edits." });
    } catch (err) {
      if (session.aborted) return;
      console.error("Audio import error:", err);
      toast({ title: "Import failed", description: err.message || "Failed to process audio.", variant: "destructive" });
      setProcessing(false);
      setProcessingStep("");
    }
  }, [audioFile, contextText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.aborted = true;
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent fullScreen={isMobile} className={isMobile ? "" : "max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden"}>
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">Add New Lead</DialogTitle>
              <p className="text-xs text-muted-foreground">Enter details or import audio.</p>
            </div>
            {!processing && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs shrink-0"
                onClick={() => {
                  setImportMode(!importMode);
                  if (importMode) resetImport();
                }}
              >
                <Mic className="h-3.5 w-3.5" />
                Import
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Audio Import Area */}
        {importMode && !processing && (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-3">
            {!audioFile && !showContext && (
              <>
                <div
                  className="flex flex-col items-center justify-center gap-2 py-4 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileAudio className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload audio file</p>
                  <p className="text-xs text-muted-foreground">Voicemails, calls, notes</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </>
            )}

            {/* Context step */}
            {showContext && audioFile && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                    <FileAudio className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[180px]">{audioFile.name}</span>
                    <span className="shrink-0">· {(audioFile.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  <button onClick={() => { setAudioFile(null); setShowContext(false); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Textarea
                  className="text-sm min-h-[50px]"
                  placeholder="Add context (optional)"
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => handleProcess(true)}>
                    Skip
                  </Button>
                  <Button size="sm" className="text-xs" onClick={() => handleProcess(false)}>
                    Autofill
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing overlay */}
        {processing && (
          <div className="rounded-lg border border-border bg-muted/30 p-6 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              {processingStep === "transcribing" ? "Transcribing audio..." : "Analyzing with AI..."}
            </p>
            <p className="text-xs text-muted-foreground">This may take a moment.</p>
          </div>
        )}

        <div className="space-y-4 mt-4">
          <ManualTab
            key={resetKey}
            onLeadCreated={handleLeadCreated}
            referrers={referrers}
            onReferrerAdded={onReferrerAdded}
            aiPrefill={aiPrefill}
            isProcessing={processing}
            customFields={customFields}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
