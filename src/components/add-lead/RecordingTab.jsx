import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Mic } from "lucide-react";
import DropFile from "@/pages/DemoPage/DropFile";
import ListenModeForm from "@/pages/DemoPage/ListenModeForm";
import ListenModeRecording from "@/pages/DemoPage/ListenModeRecording";
import TourSummary from "@/pages/DemoPage/TourSummary";
import SectionDetail from "@/pages/DemoPage/SectionDetail";
import { createLeadFromSession } from "@/utils/createLeadFromSession";
import "./modal-embedded.css";

export default function RecordingTab({ onLeadCreated, resetKey }) {
  const [step, setStep] = useState("choose"); // choose, dropFile, form, recording, summary, detail
  const [flowType, setFlowType] = useState(null); // 'listen' or 'dropFile'
  const [formData, setFormData] = useState(null);
  const [recordingData, setRecordingData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);

  // Reset state when resetKey changes (tab switch or modal close)
  useEffect(() => {
    setStep("choose");
    setFlowType(null);
    setFormData(null);
    setRecordingData(null);
    setSummaryData(null);
    setCurrentSection(null);
  }, [resetKey]);

  const handleDropFileTranscriptionComplete = (data) => {
    setRecordingData(data);
    setStep("form");
  };

  const handleFormSubmit = (data) => {
    setFormData(data);
    if (flowType === "listen") {
      setStep("recording");
    } else {
      // dropFile flow: already have recording data, go to summary
      setStep("summary");
    }
  };

  const handleRecordingSubmit = (data) => {
    setRecordingData(data);
    setStep("summary");
  };

  const handleSummaryAnalyzed = (data) => {
    setSummaryData(data);
  };

  const handleSectionClick = (section) => {
    setCurrentSection(section);
    setStep("detail");
  };

  const handleSeeCRM = () => {
    const lead = createLeadFromSession({
      formData,
      recordingData,
      summaryData,
      id: `recording-lead-${Date.now()}`,
    });
    onLeadCreated(lead, { autoOpen: true });
  };

  if (step === "dropFile") {
    return (
      <div className="modal-embedded">
        <DropFile
          onTranscriptionComplete={handleDropFileTranscriptionComplete}
          onBack={() => setStep("choose")}
        />
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="modal-embedded">
        <ListenModeForm
          onSubmit={handleFormSubmit}
          onBack={() => setStep("choose")}
        />
      </div>
    );
  }

  if (step === "recording") {
    return (
      <div className="modal-embedded">
        <ListenModeRecording
          formData={formData}
          onSubmit={handleRecordingSubmit}
          onBack={() => setStep("form")}
        />
      </div>
    );
  }

  if (step === "summary") {
    return (
      <div className="modal-embedded">
        <TourSummary
          formData={formData}
          recordingData={recordingData}
          summaryData={summaryData}
          onSummaryAnalyzed={handleSummaryAnalyzed}
          onSectionClick={handleSectionClick}
          onBack={() => setStep("choose")}
          onSeeCRM={handleSeeCRM}
        />
      </div>
    );
  }

  if (step === "detail") {
    return (
      <div className="modal-embedded">
        <SectionDetail
          section={currentSection}
          formData={formData}
          onBack={() => setStep("summary")}
        />
      </div>
    );
  }

  // choose step
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <p className="text-sm text-muted-foreground text-center mb-2">
        How would you like to add a recording?
      </p>
      <Button
        variant="outline"
        className="w-full max-w-xs h-20 flex flex-col items-center gap-2"
        onClick={() => { setFlowType("dropFile"); setStep("dropFile"); }}
      >
        <Upload className="h-6 w-6" />
        <span className="text-sm font-medium">Upload Audio File</span>
      </Button>
      <Button
        variant="outline"
        className="w-full max-w-xs h-20 flex flex-col items-center gap-2"
        onClick={() => { setFlowType("listen"); setStep("form"); }}
      >
        <Mic className="h-6 w-6" />
        <span className="text-sm font-medium">Record on the Spot</span>
      </Button>
    </div>
  );
}
