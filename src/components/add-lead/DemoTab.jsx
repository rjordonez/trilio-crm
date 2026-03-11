import { useState, useEffect } from "react";
import AudioSampleIntro from "@/pages/DemoPage/AudioSampleIntro";
import AudioSampleForm from "@/pages/DemoPage/AudioSampleForm";
import TourSummary from "@/pages/DemoPage/TourSummary";
import SectionDetail from "@/pages/DemoPage/SectionDetail";
import { audioSampleMockData } from "@/data/mockAudioSampleData";
import { createLeadFromSession } from "@/utils/createLeadFromSession";
import "./modal-embedded.css";

export default function DemoTab({ onLeadCreated, resetKey }) {
  const [step, setStep] = useState("intro"); // intro, form, summary, detail
  const [formData, setFormData] = useState(null);
  const [recordingData, setRecordingData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);

  // Reset state when resetKey changes (tab switch or modal close)
  useEffect(() => {
    setStep("intro");
    setFormData(null);
    setRecordingData(null);
    setSummaryData(null);
    setCurrentSection(null);
  }, [resetKey]);

  const handleIntroNext = () => {
    setFormData(audioSampleMockData.formData);
    setStep("form");
  };

  const handleFormNext = () => {
    setRecordingData(audioSampleMockData.recordingData);
    setSummaryData(audioSampleMockData.summaryData);
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
      id: `demo-lead-${Date.now()}`,
    });
    onLeadCreated(lead, { autoOpen: true });
  };

  if (step === "form") {
    return (
      <div className="modal-embedded">
        <AudioSampleForm
          formData={formData}
          onNext={handleFormNext}
          onBack={() => setStep("intro")}
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
          onBack={() => setStep("intro")}
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

  // intro step
  return (
    <div className="modal-embedded">
      <AudioSampleIntro
        onNext={handleIntroNext}
        onBack={() => {}} // No-op inside modal; back button is hidden by CSS
      />
    </div>
  );
}
