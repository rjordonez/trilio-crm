import React, { useState, useRef, useEffect } from 'react';
import './ListenModeRecording.css';
import { transcribeAudio } from '../../services/speechToText';

function ListenModeRecording({ formData, onSubmit, onBack }) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const audioURLRef = useRef(null);

  useEffect(() => {
    checkMicrophonePermission();

    return () => {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Stop active recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      // Release microphone
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Release object URL
      if (audioURLRef.current) {
        URL.revokeObjectURL(audioURLRef.current);
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setPermissionDenied(true);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioURLRef.current) {
          URL.revokeObjectURL(audioURLRef.current);
        }
        const url = URL.createObjectURL(audioBlob);
        audioURLRef.current = url;
        setAudioURL(url);
        setHasRecorded(true);

        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Could not access microphone. Please ensure permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleSubmit = async () => {
    if (hasRecorded && audioURL) {
      setIsTranscribing(true);
      setTranscriptionError(null);

      try {
        const blob = await fetch(audioURL).then(res => res.blob());

        // Call speech-to-text service
        const result = await transcribeAudio(blob, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          situation: formData.situation
        });

        // Pass both audio blob and transcription to parent
        onSubmit({
          audioBlob: blob,
          transcription: result.transcription,
          confidence: result.confidence,
          provider: result.provider
        });
      } catch (error) {
        console.error('Transcription error:', error);
        setTranscriptionError('Failed to transcribe audio. Please try again.');
        setIsTranscribing(false);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (permissionDenied) {
    return (
      <div className="recording-page">
        <div className="recording-container">
          <button className="back-button" onClick={onBack}>← Back</button>
          <div className="permission-denied">
            <h2>Microphone Access Required</h2>
            <p>Please enable microphone permissions in your browser settings to continue.</p>
            <button className="retry-btn" onClick={checkMicrophonePermission}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!permissionGranted) {
    return (
      <div className="recording-page">
        <div className="recording-container">
          <button className="back-button" onClick={onBack}>← Back</button>
          <div className="checking-permission">
            <h2>Checking microphone access...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recording-page">
      <div className="recording-container">
        <button className="back-button" onClick={onBack}>← Back</button>

        <h1>Record Tour Notes</h1>
        <p className="recording-subtitle">
          Recording for {formData.firstName} {formData.lastName}
        </p>

        <div className="recording-area">
          {!hasRecorded ? (
            <>
              <button
                className={`record-button ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <div className="stop-icon">
                    <div className="stop-square"></div>
                  </div>
                ) : (
                  <div className="mic-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
                    </svg>
                  </div>
                )}
              </button>

              {isRecording && (
                <div className="recording-indicator">
                  <div className="pulse-dot"></div>
                  <span>Recording: {formatTime(recordingTime)}</span>
                </div>
              )}

              {!isRecording && (
                <p className="record-instruction">Tap to start recording</p>
              )}
            </>
          ) : (
            <>
              <div className="playback-section">
                <h3>Recording Complete</h3>
                <p>Duration: {formatTime(recordingTime)}</p>

                <audio controls src={audioURL} className="audio-player">
                  Your browser does not support the audio element.
                </audio>

                {transcriptionError && (
                  <div className="error-message-box">
                    {transcriptionError}
                  </div>
                )}

                <div className="playback-actions">
                  <button
                    className="re-record-btn"
                    onClick={() => {
                      if (audioURLRef.current) {
                        URL.revokeObjectURL(audioURLRef.current);
                        audioURLRef.current = null;
                      }
                      setHasRecorded(false);
                      setAudioURL(null);
                      setRecordingTime(0);
                      setTranscriptionError(null);
                    }}
                    disabled={isTranscribing}
                  >
                    Re-record
                  </button>
                  <button
                    className="submit-audio-btn"
                    onClick={handleSubmit}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? 'Transcribing...' : 'Submit Audio to AI'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListenModeRecording;
