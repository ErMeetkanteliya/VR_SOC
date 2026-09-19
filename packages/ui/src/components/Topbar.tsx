"use client";

import React, { useState } from "react";
import { cn } from "../utils";
import { Search, Bell, Menu, ChevronDown, Building2, Settings, LogOut, ExternalLink } from "lucide-react";
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";
import { IconButton } from "./IconButton";
import { Badge } from "./Badge";

export interface TopbarProps {
  breadcrumbs?: BreadcrumbItem[];
  organizationName?: string;
  organizationSlot?: React.ReactNode;
  userEmail?: string;
  userRole?: string;
  notificationsCount?: number;
  onMenuToggle?: () => void;
  onSearchClick?: () => void;
  onLogout?: () => void;
  className?: string;
}

export function Topbar({
  breadcrumbs = [{ label: "Dashboard" }],
  organizationName = "Cyber Defense Academy",
  organizationSlot,
  userEmail = "analyst@vrsoc.app",
  userRole = "Super Admin",
  notificationsCount = 3,
  onMenuToggle,
  onSearchClick,
  onLogout,
  className,
}: TopbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "h-16 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 shrink-0",
        className
      )}
    >
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/5"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Right: Quick Search, Org Switcher, Notifications, User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Quick Search Trigger */}
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/40 hover:text-white hover:border-white/20 transition-all duration-150"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Quick search...</span>
            <kbd className="text-[10px] font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
              Ctrl+K
            </kbd>
          </button>
        )}

        {/* Organization Switcher Slot or Default Preview */}
        {organizationSlot ? (
          <div>{organizationSlot}</div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white/80 cursor-pointer hover:bg-white/[0.06] transition-colors">
            <Building2 className="w-3.5 h-3.5 text-[#E53935]" />
            <span className="font-medium max-w-[140px] truncate">{organizationName}</span>
            <ChevronDown className="w-3 h-3 text-white/40" />
          </div>
        )}

        {/* Notifications Bell with Badge */}
        <div className="relative">
          <IconButton label="Notifications" variant="ghost" size="sm">
            <Bell className="w-4 h-4 text-white/70" />
          </IconButton>
          {notificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E53935] ring-2 ring-[#0A0A0A]" />
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative pl-2 border-l border-white/10">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-[#5B0A0A] border border-[#E53935]/40 flex items-center justify-center text-xs font-bold text-white uppercase select-none shadow-sm">
              {userEmail.charAt(0)}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-medium text-white max-w-[130px] truncate">{userEmail}</span>
              <span className="text-[10px] font-mono text-emerald-400 leading-none">{userRole}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-white/40 hidden xl:block" />
          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
              <div
                role="menu"
                aria-label="User account actions"
                className="absolute right-0 mt-2 w-64 rounded-xl bg-[#161616] border border-white/15 shadow-2xl z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100 text-left"
              >
                {/* User Info Header */}
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-white/40">Signed in as</span>
                    <Badge variant={userRole === "Super Admin" ? "burgundy" : "default"}>
                      {userRole}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-white truncate">{userEmail}</p>
                </div>

                {/* Menu Links */}
                <div className="space-y-0.5 text-xs text-white/70">
                  <a
                    href="/settings"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-white/50" />
                    <span>Platform Settings</span>
                  </a>

                  <a
                    href="/knowledge"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-white/50" />
                    <span>Knowledge Center</span>
                  </a>

                  <a
                    href="/design-system"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-white/50" />
                    <span>Design System Showcase</span>
                  </a>
                </div>

                {/* Logout Trigger */}
                <div className="border-t border-white/10 pt-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onLogout) {
                        onLogout();
                      } else if (typeof window !== "undefined") {
                        window.location.href = "/login";
                      }
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
