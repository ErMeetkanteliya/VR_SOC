"use client";

import React, { useState } from "react";
import { MessageSquare, Trash2, Tag, Send } from "lucide-react";
import type { HuntNote, CreateHuntNoteInput } from "@vrsoc/types";

interface HuntNotesPanelProps {
  notes: HuntNote[];
  onAddNote: (input: CreateHuntNoteInput) => Promise<boolean>;
  onDeleteNote: (id: string) => Promise<boolean>;
}

export const HuntNotesPanel: React.FC<HuntNotesPanelProps> = ({
  notes,
  onAddNote,
  onDeleteNote,
}) => {
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const success = await onAddNote({
      content: content.trim(),
      tags,
    });
    setIsSubmitting(false);

    if (success) {
      setContent("");
      setTagsInput("");
    }
  };

  return (
    <div className="space-y-4" data-testid="hunt-notes-panel">
      <div className="flex items-center justify-between pb-1 border-b border-white/5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Analyst Investigation Notes ({notes.length})
          </h3>
        </div>
        <span className="text-[11px] text-white/40">Tenant Scoped & Audited</span>
      </div>

      {/* Note Entry Form */}
      <form
        onSubmit={handleSubmit}
        data-testid="add-note-form"
        className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-3 shadow-md"
      >
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-white/60 uppercase">Add Investigation Note</label>
          <textarea
            rows={3}
            required
            data-testid="note-content-input"
            placeholder="Record investigative hypotheses, triage findings, containment recommendations, or containment steps..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Tag className="w-3.5 h-3.5 text-white/40 shrink-0" />
            <input
              type="text"
              data-testid="note-tags-input"
              placeholder="Tags (e.g. Triage, Containment, C2)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#181818] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            data-testid="submit-note-btn"
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>{isSubmitting ? "Posting..." : "Post Note"}</span>
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            data-testid={`note-item-${note.id}`}
            className="p-4 rounded-xl bg-[#141414] border border-white/10 shadow-md space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">{note.author_name}</span>
                <span className="text-[11px] font-mono text-white/40">
                  {new Date(note.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <button
                type="button"
                data-testid={`delete-note-btn-${note.id}`}
                onClick={() => onDeleteNote(note.id)}
                className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete Note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-white/80 whitespace-pre-wrap leading-relaxed">
              {note.content}
            </p>

            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-white/60 border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {notes.length === 0 && (
          <div className="p-8 text-center rounded-xl bg-[#121212] border border-white/5 text-white/40 text-xs italic">
            No analyst notes recorded yet. Post hypotheses and observations above.
          </div>
        )}
      </div>
    </div>
  );
};
