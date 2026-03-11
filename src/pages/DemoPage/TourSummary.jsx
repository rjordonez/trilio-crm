import React, { useState, useEffect } from 'react';
import './TourSummary.css';
import { analyzeTourTranscription } from '../../services/aiService';

function TourSummary({ formData, recordingData, summaryData: persistedSummaryData, onSummaryAnalyzed, onSectionClick, onBack, onSeeCRM }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [audioURL] = useState(recordingData?.audioBlob ? URL.createObjectURL(recordingData.audioBlob) : null);
  const [summaryData, setSummaryData] = useState(persistedSummaryData);
  const [isAnalyzing, setIsAnalyzing] = useState(!persistedSummaryData);
  const [analysisError, setAnalysisError] = useState(null);

  useEffect(() => {
    // Only analyze if we don't have persisted data
    if (!persistedSummaryData) {
      analyzeTranscription();
    }
  }, []);

  const analyzeTranscription = async () => {
    if (!recordingData?.transcription) {
      setAnalysisError('No transcription available');
      setIsAnalyzing(false);
      return;
    }

    try {
      setIsAnalyzing(true);
      const result = await analyzeTourTranscription(recordingData.transcription, formData);

      const newSummaryData = {
        keyPoints: result.keyPoints,
        concerns: result.concerns,
        smallThings: result.smallThings,
        decisionMakers: result.decisionMakers || [],
        budget: result.budget || [],
        careLevel: result.careLevel || [],
        transcription: recordingData.transcription
      };

      setSummaryData(newSummaryData);
      onSummaryAnalyzed(newSummaryData); // Persist to parent
      setIsAnalyzing(false);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError('Failed to analyze transcription. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const sections = summaryData ? [
    {
      id: 'keyPoints',
      title: 'Key Points',
      preview: summaryData.keyPoints.slice(0, 2).join(' • '),
      items: summaryData.keyPoints
    },
    {
      id: 'concerns',
      title: 'Concerns',
      preview: summaryData.concerns.slice(0, 2).join(' • '),
      items: summaryData.concerns
    },
    {
      id: 'smallThings',
      title: 'Small Things',
      preview: summaryData.smallThings.slice(0, 2).join(' • '),
      items: summaryData.smallThings
    },
    ...(summaryData.decisionMakers?.length > 0 ? [{
      id: 'decisionMakers',
      title: 'Decision Makers',
      preview: summaryData.decisionMakers.slice(0, 2).join(' • '),
      items: summaryData.decisionMakers
    }] : []),
    ...(summaryData.budget?.length > 0 ? [{
      id: 'budget',
      title: 'Budget & Financial',
      preview: summaryData.budget.slice(0, 2).join(' • '),
      items: summaryData.budget
    }] : []),
    ...(summaryData.careLevel?.length > 0 ? [{
      id: 'careLevel',
      title: 'Level of Care',
      preview: summaryData.careLevel.slice(0, 2).join(' • '),
      items: summaryData.careLevel
    }] : []),
    {
      id: 'transcription',
      title: 'Raw Transcription',
      preview: summaryData.transcription.substring(0, 100) + '...',
      fullText: summaryData.transcription
    },
    {
      id: 'recording',
      title: 'Recording',
      preview: 'Audio recording available',
      audioURL: audioURL
    }
  ] : [];

  const toggleSection = (sectionId) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
    }
  };

  const handleSectionClick = (section) => {
    if (section.id === 'recording' || section.id === 'transcription') {
      // Just expand/collapse these sections instead of navigating
      toggleSection(section.id);
    } else {
      // Navigate to detail view for editable sections
      onSectionClick(section);
    }
  };

  return (
    <div className="tour-summary">
      <div className="summary-container">
        <button className="back-button" onClick={onBack}>← Home</button>

        <h1>Tour: {formData.firstName} {formData.lastName}</h1>
        <p className="summary-subtitle">{formData.situation}</p>

        {isAnalyzing && (
          <div className="analyzing-message">
            <div className="spinner"></div>
            <p>AI is analyzing the conversation...</p>
          </div>
        )}

        {analysisError && (
          <div className="error-message-box">
            {analysisError}
            <button className="retry-button" onClick={analyzeTranscription}>
              Retry Analysis
            </button>
          </div>
        )}

        {!isAnalyzing && !analysisError && (
          <div className="sections-list">
          {sections.map((section) => (
            <div key={section.id} className="section-item">
              <div
                className="section-header"
                onClick={() => handleSectionClick(section)}
              >
                <div className="section-title-row">
                  <h3>{section.title}</h3>
                  <span className="chevron">{expandedSection === section.id ? '∨' : '›'}</span>
                </div>
                {expandedSection !== section.id && (
                  <p className="section-preview">{section.preview}</p>
                )}
              </div>

              {expandedSection === section.id && (
                <div className="section-content">
                  {section.id === 'recording' && section.audioURL ? (
                    <div className="recording-playback">
                      <audio controls src={section.audioURL} className="audio-player">
                        Your browser does not support the audio element.
                      </audio>
                      <button className="save-recording-btn">Save Recording</button>
                    </div>
                  ) : section.id === 'transcription' ? (
                    <p className="transcription-text">{section.fullText}</p>
                  ) : (
                    <ul className="items-list">
                      {section.items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  )}

                  {section.items && (
                    <button
                      className="view-details-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSectionClick(section);
                      }}
                    >
                      View & Edit Details →
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          </div>
        )}

        {!isAnalyzing && !analysisError && (
          <button className="finish-btn" onClick={onSeeCRM}>
            Save Details
          </button>
        )}
      </div>
    </div>
  );
}

export default TourSummary;
