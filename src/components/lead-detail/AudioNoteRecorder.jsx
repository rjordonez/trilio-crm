import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, X, Keyboard, Phone, Mail, Eye, MessageSquare, Users } from "lucide-react";
import { transcribeAudio } from '../../services/speechToText';

const noteTypes = [
  { type: 'call', label: 'Call', icon: Phone },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'tour', label: 'Tour', icon: Eye },
  { type: 'meeting', label: 'Meeting', icon: Users },
  { type: 'note', label: 'Note', icon: MessageSquare },
];

export default function AudioNoteRecorder({ onAddNote, onCancel }) {
  const [mode, setMode] = useState(null); // null, 'record', 'manual'
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  // Manual mode state
  const [selectedType, setSelectedType] = useState('note');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Cleanup mic stream on unmount
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
      setError('Could not access microphone. Check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const processAudio = async (audioBlob) => {
    setProcessing(true);
    try {
      const result = await transcribeAudio(audioBlob, {});
      const transcription = result.transcription;

      const response = await fetch('/api/analyze-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription })
      });

      if (!response.ok) throw new Error('Failed to analyze note');
      const { title, description, type } = await response.json();

      onAddNote({
        id: `note-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: type || 'note',
        title,
        description,
        by: 'You'
      });
    } catch (err) {
      console.error('Note processing error:', err);
      setProcessing(false);
      setError('Failed to process recording. Try again or use Type Note.');
    }
  };

  const handleManualSubmit = () => {
    if (!manualTitle.trim()) return;

    onAddNote({
      id: `note-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: selectedType,
      title: manualTitle.trim(),
      description: manualDesc.trim(),
      by: 'You'
    });
  };

  if (processing) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md border border-border bg-muted/30">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">AI is formatting your note...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">{error}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { setError(null); setMode(null); }}>Try Again</Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    );
  }

  // Initial choice
  if (!mode) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setMode('record')}>
          <Mic className="h-3.5 w-3.5 mr-1.5" /> Record Note
        </Button>
        <Button size="sm" variant="outline" onClick={() => setMode('manual')}>
          <Keyboard className="h-3.5 w-3.5 mr-1.5" /> Type Note
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  // Record mode
  if (mode === 'record') {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={recording ? "destructive" : "default"}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? <Square className="h-3.5 w-3.5 mr-1.5" /> : <Mic className="h-3.5 w-3.5 mr-1.5" />}
          {recording ? "Stop" : "Start Recording"}
        </Button>
        {recording && <span className="text-sm text-destructive animate-pulse">Recording...</span>}
        {!recording && (
          <Button size="sm" variant="ghost" onClick={() => setMode(null)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  // Manual mode
  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      {/* Type selector */}
      <div className="flex items-center gap-1.5">
        {noteTypes.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              selectedType === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      <input
        value={manualTitle}
        onChange={(e) => setManualTitle(e.target.value)}
        placeholder="Title (e.g. Follow-up call with daughter)"
        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />

      <textarea
        value={manualDesc}
        onChange={(e) => setManualDesc(e.target.value)}
        placeholder="Description (optional)"
        className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
      />

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleManualSubmit} disabled={!manualTitle.trim()}>
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setMode(null); setManualTitle(''); setManualDesc(''); setSelectedType('note'); }}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
