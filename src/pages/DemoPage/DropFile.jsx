import React, { useState, useRef } from 'react';
import './DropFile.css';
import { transcribeAudio } from '../../services/speechToText';

function DropFile({ onTranscriptionComplete, onBack }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    // Check if file is audio
    if (!file.type.startsWith('audio/')) {
      setTranscriptionError('Please upload an audio file (MP3, WAV, M4A, etc.)');
      return;
    }

    setSelectedFile(file);
    setTranscriptionError(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTranscribe = async () => {
    if (!selectedFile) return;

    setIsTranscribing(true);
    setTranscriptionError(null);

    try {
      // Call speech-to-text service
      const result = await transcribeAudio(selectedFile, {});

      // Pass transcription data to parent
      onTranscriptionComplete({
        audioBlob: selectedFile,
        transcription: result.transcription,
        confidence: result.confidence,
        provider: result.provider
      });
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptionError('Failed to transcribe audio. Please try again.');
      setIsTranscribing(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setTranscriptionError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="drop-file-page">
      <div className="drop-file-container">
        <button className="back-button" onClick={onBack}>← Back</button>

        <h1>Upload Audio File</h1>
        <p className="drop-file-subtitle">Upload a tour recording to analyze</p>

        {!selectedFile ? (
          <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />

            <div className="upload-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
                <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
              </svg>
            </div>

            <p className="drop-zone-text">
              <strong>Drop your audio file here</strong> or click to browse
            </p>
            <p className="drop-zone-hint">
              Supports MP3, WAV, M4A, and other audio formats
            </p>
          </div>
        ) : (
          <div className="file-selected">
            <div className="file-info">
              <div className="file-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <div className="file-details">
                <p className="file-name">{selectedFile.name}</p>
                <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button className="remove-file-btn" onClick={handleRemoveFile} disabled={isTranscribing}>
                ✕
              </button>
            </div>

            {transcriptionError && (
              <div className="error-message-box">
                {transcriptionError}
              </div>
            )}

            <button
              className="transcribe-btn"
              onClick={handleTranscribe}
              disabled={isTranscribing}
            >
              {isTranscribing ? 'Transcribing...' : 'Transcribe & Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DropFile;
