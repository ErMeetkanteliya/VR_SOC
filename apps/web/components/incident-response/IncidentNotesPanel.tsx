"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Tag, Trash2, User } from "lucide-react";
import type { IncidentNote, CreateIncidentNoteInput } from "@vrsoc/types";

interface IncidentNotesPanelProps {
  notes: IncidentNote[];
  onCreateNote: (input: CreateIncidentNoteInput) => Promise<boolean>;
  onDeleteNote: (id: string) => Promise<boolean>;
  disabled?: boolean;
}

export const IncidentNotesPanel: React.FC<IncidentNotesPanelProps> = ({
  notes,
  onCreateNote,
  onDeleteNote,
  disabled = false,
}) => {
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const ok = await onCreateNote({
      incident_id: "",
      content: content.trim(),
      tags,
    });
    setIsSubmitting(false);

    if (ok) {
      setContent("");
      setTags([]);
    }
  };

  return (
    <div className="space-y-4" data-testid="incident-notes-panel">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-red-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Analyst Investigation Notes ({notes.length})
        </h3>
      </div>

      {/* Post Note Form */}
      {!disabled && (
        <form
          onSubmit={handlePostNote}
          className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-3 shadow-md"
        >
          <textarea
            data-testid="incident-note-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Record investigation findings, hypothesis validations, or containment actions..."
            rows={3}
            required
            className="w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tag Input */}
            <div className="flex items-center gap-2 flex-1">
              <Tag className="w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag (e.g. Containment)..."
                className="px-2.5 py-1 rounded bg-[#111] border border-white/10 text-[11px] text-white placeholder:text-white/30"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] text-white/70"
              >
                + Tag
              </button>

              <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-white font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              data-testid="submit-note-btn"
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Posting..." : "Post Note"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Notes Stream */}
      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            data-testid={`incident-note-${note.id}`}
            className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-[10px]">
                  <User className="w-3 h-3" />
                </div>
                <span className="font-semibold text-white">{note.author_name}</span>
                <span className="text-[11px] text-white/40">
                  • {new Date(note.created_at).toLocaleString()}
                </span>
              </div>

              {!disabled && (
                <button
                  type="button"
                  onClick={() => onDeleteNote(note.id)}
                  className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">
              {note.content}
            </p>

            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {note.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-white/60 border border-white/5"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {notes.length === 0 && (
          <div className="p-8 text-center rounded-xl bg-[#121212] border border-white/5 text-white/40 text-xs italic">
            No notes posted yet. Add the first investigation note above.
          </div>
        )}
      </div>
    </div>
  );
};
