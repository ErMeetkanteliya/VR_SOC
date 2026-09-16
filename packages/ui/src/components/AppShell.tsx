import React, { useState } from "react";
import { cn } from "../utils";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette, type CommandItem } from "./CommandPalette";

export interface AppShellProps {
  currentPath?: string;
  children: React.ReactNode;
  organizationName?: string;
  userEmail?: string;
  commandItems?: CommandItem[];
  className?: string;
}

export function AppShell({
  currentPath = "/",
  children,
  organizationName = "Cyber Defense Academy",
  userEmail = "analyst@vrsoc.app",
  commandItems = [],
  className,
}: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <div className={cn("flex h-screen bg-[#0A0A0A] text-white overflow-hidden", className)}>
      {/* 240px Collapsible Sidebar */}
      <Sidebar
        currentPath={currentPath}
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          organizationName={organizationName}
          userEmail={userEmail}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onSearchClick={() => setIsCommandPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0A0A0A]">
          {children}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        items={commandItems}
      />
    </div>
  );
}
