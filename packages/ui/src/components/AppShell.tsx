"use client";

import React, { useState, useEffect } from "react";
import { cn } from "../utils";
import { Sidebar, type NavGroup } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette, type CommandItem } from "./CommandPalette";
import type { BreadcrumbItem } from "./Breadcrumbs";

export interface AppShellProps {
  currentPath?: string;
  breadcrumbs?: BreadcrumbItem[];
  navGroups?: NavGroup[];
  children: React.ReactNode;
  organizationName?: string;
  organizationSlot?: React.ReactNode;
  userEmail?: string;
  userRole?: string;
  commandItems?: CommandItem[];
  onLogout?: () => void;
  className?: string;
}

export function AppShell({
  currentPath = "/",
  breadcrumbs,
  navGroups,
  children,
  organizationName = "Cyber Defense Academy",
  organizationSlot,
  userEmail = "analyst@vrsoc.app",
  userRole = "Super Admin",
  commandItems = [],
  onLogout,
  className,
}: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Default breadcrumbs if not provided
  const computedBreadcrumbs: BreadcrumbItem[] = breadcrumbs || [
    { label: "Dashboard", href: "/" },
    ...(currentPath !== "/"
      ? [
          {
            label:
              currentPath.slice(1).charAt(0).toUpperCase() +
              currentPath.slice(2).replace(/-/g, " "),
          },
        ]
      : []),
  ];

  return (
    <div className={cn("flex h-screen bg-[#0A0A0A] text-white overflow-hidden", className)}>
      {/* 240px Collapsible Sidebar */}
      <Sidebar
        currentPath={currentPath}
        groups={navGroups}
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          breadcrumbs={computedBreadcrumbs}
          organizationName={organizationName}
          organizationSlot={organizationSlot}
          userEmail={userEmail}
          userRole={userRole}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onSearchClick={() => setIsCommandPaletteOpen(true)}
          onLogout={onLogout}
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
