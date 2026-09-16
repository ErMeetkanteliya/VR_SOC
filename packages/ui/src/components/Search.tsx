import React from "react";
import { cn } from "../utils";
import { Search as SearchIcon } from "lucide-react";

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (query: string) => void;
  shortcutHint?: string;
}

export const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ className, placeholder = "Search alerts, logs, assets...", shortcutHint = "Ctrl+K", onSearch, ...props }, ref) => {
    return (
      <div className={cn("relative flex items-center w-full max-w-md", className)}>
        <SearchIcon className="w-4 h-4 text-white/40 absolute left-3 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          className="w-full h-9 bg-white/5 border border-white/10 rounded-lg pl-9 pr-14 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935]/50 transition-all duration-150"
          {...props}
        />
        {shortcutHint && (
          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase text-white/40 bg-white/5 border border-white/10 rounded pointer-events-none">
            {shortcutHint}
          </kbd>
        )}
      </div>
    );
  }
);
Search.displayName = "Search";
