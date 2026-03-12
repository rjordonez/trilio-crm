import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Phone, Mail, Eye, MessageSquare, Users } from "lucide-react";

const noteTypes = [
  { type: 'call', label: 'Call', icon: Phone },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'tour', label: 'Tour', icon: Eye },
  { type: 'meeting', label: 'Meeting', icon: Users },
  { type: 'note', label: 'Note', icon: MessageSquare },
];

export default function AudioNoteRecorder({ onAddNote, onCancel }) {
  const [selectedType, setSelectedType] = useState('note');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAddNote({
      id: `note-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: selectedType,
      title: title.trim(),
      description: desc.trim(),
      by: 'You'
    });
  };

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="flex items-center gap-1.5 flex-wrap">
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
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. Follow-up call with daughter)"
        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        autoFocus
      />

      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Description (optional)"
        className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
      />

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
