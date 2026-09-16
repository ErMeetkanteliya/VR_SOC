"use client";

import React, { useState, useEffect } from "react";
import { cn } from "../utils";
import { Search, X, Command } from "lucide-react";

export interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandItem[];
}

export function CommandPalette({ isOpen, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        isOpen ? onClose() : undefined;
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = items.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-xl bg-[#161616] border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100 flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-4 h-4 text-white/40 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, route, or search query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="w-6 h-6 rounded text-white/40 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filteredItems.length === 0 ? (
            <p className="p-4 text-center text-xs text-white/40">No matching commands or routes.</p>
          ) : (
            filteredItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onSelect();
                  onClose();
                }}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-xs flex items-center justify-between text-left transition-colors",
                  idx === selectedIndex ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-white/40">{item.icon || <Command className="w-3.5 h-3.5" />}</span>
                  <span className="font-medium text-white">{item.label}</span>
                  <span className="text-[10px] font-mono text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>
                {item.shortcut && (
                  <kbd className="text-[10px] font-mono text-white/40 uppercase">{item.shortcut}</kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
          <span>Navigate with ↑ ↓ • Press ESC to close</span>
          <span>VRSOC Command Palette</span>
        </div>
      </div>
    </div>
  );
}
