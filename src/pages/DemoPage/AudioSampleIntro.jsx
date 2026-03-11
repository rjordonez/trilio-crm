import React from 'react';
import './DropFile.css';

function AudioSampleIntro({ onNext, onBack }) {
  return (
    <div className="drop-file-page">
      <div className="drop-file-container">
        <button className="back-button" onClick={onBack}>← Back</button>

        <h1>Audio Sample Demo</h1>
        <p className="drop-file-subtitle">Listen to a sample conversation and see how our AI analyzes it</p>

        <div style={{
          padding: '24px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          marginBottom: '24px',
          lineHeight: '1.6',
          textAlign: 'left'
        }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#2c3e50' }}>
            This is a sample conversation between a senior living advisor and a prospective resident's
            family during an inquiry call.
          </p>
          <p style={{ margin: '0', fontSize: '14px', color: '#5a6c7d' }}>
            Listen to how our AI captures and analyzes the conversation to extract key information,
            concerns, and personal details that help provide better care.
          </p>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: '#fff',
          border: '2px solid #e9ecef',
          borderRadius: '12px',
          marginBottom: '32px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: '#2c3e50' }}>
            Sample Conversation Recording
          </h3>
          <audio
            controls
            style={{
              width: '100%',
              marginBottom: '12px'
            }}
          >
            <source src="/demo-audio2.mp3" type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <p style={{
            margin: '0',
            fontSize: '13px',
            color: '#6c757d',
            fontStyle: 'italic'
          }}>
            Duration: ~3 minutes • A conversation about assisted living options
          </p>
        </div>

        <button className="transcribe-btn" onClick={onNext}>
          Next: See Information Capture →
        </button>
      </div>
    </div>
  );
}

export default AudioSampleIntro;
