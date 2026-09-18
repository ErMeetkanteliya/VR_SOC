"use client";

import React from "react";
import { cn } from "../utils";
import {
  LayoutDashboard,
  ShieldAlert,
  Server,
  AlertTriangle,
  Flame,
  Binary,
  Layers,
  FileText,
  Briefcase,
  BarChart3,
  Bot,
  BookOpen,
  Settings,
  Activity,
  Workflow,
  Cpu,
  Globe,
  Crosshair,
  Sparkles,
  Zap,
  CheckCircle2,
  FolderKanban,
  Clock,
  Radio,
  FileSpreadsheet,
  FlaskConical,
  Wrench,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "default" | "critical" | "warning" | "ai";
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export const DEFAULT_NAV_GROUPS: NavGroup[] = [
  {
    title: "Core Operations",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/", icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: "agents", label: "Agents (EDR)", href: "/agents", icon: <Server className="w-4 h-4" />, badge: "156" },
      { id: "alerts", label: "Alerts", href: "/alerts", icon: <AlertTriangle className="w-4 h-4" />, badge: "24", badgeVariant: "critical" },
      { id: "incidents", label: "Incidents", href: "/incidents", icon: <Flame className="w-4 h-4" />, badge: "7", badgeVariant: "warning" },
      { id: "detections", label: "Threat Detection", href: "/detections", icon: <ShieldAlert className="w-4 h-4" />, badge: "48" },
      { id: "threat-intelligence", label: "Threat Intelligence", href: "/threat-intelligence", icon: <Globe className="w-4 h-4" />, badge: "IOC" },
      { id: "threat-hunting", label: "Threat Hunting", href: "/threat-hunting", icon: <Crosshair className="w-4 h-4" /> },
      { id: "mitre", label: "MITRE ATT&CK", href: "/mitre", icon: <Layers className="w-4 h-4" />, badge: "78%" },
      { id: "logs", label: "Log Explorer", href: "/logs", icon: <FileText className="w-4 h-4" /> },
      { id: "cases", label: "Cases", href: "/cases", icon: <Briefcase className="w-4 h-4" />, badge: "12" },
      { id: "analytics", label: "Analytics", href: "/analytics", icon: <BarChart3 className="w-4 h-4" /> },
      { id: "ai-assistant", label: "AI Assistant", href: "/ai-assistant", icon: <Bot className="w-4 h-4" />, badge: "AI", badgeVariant: "ai" },
      { id: "knowledge", label: "Knowledge Center", href: "/knowledge", icon: <BookOpen className="w-4 h-4" />, badge: "24" },
      { id: "settings", label: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
    ],
  },
  {
    title: "SOAR Orchestration",
    items: [
      { id: "soar", label: "SOAR Dashboard", href: "/soar", icon: <Activity className="w-4 h-4" /> },
      { id: "soar-automation", label: "Automation Pipeline", href: "/soar/automation", icon: <Workflow className="w-4 h-4" /> },
      { id: "soar-playbooks", label: "Playbooks", href: "/soar/playbooks", icon: <Binary className="w-4 h-4" />, badge: "20" },
      { id: "soar-builder", label: "Playbook Builder", href: "/soar/builder", icon: <Cpu className="w-4 h-4" /> },
      { id: "soar-enrichment", label: "Threat Enrichment", href: "/soar/enrichment", icon: <Globe className="w-4 h-4" /> },
      { id: "soar-ai-engine", label: "AI Decision Engine", href: "/soar/ai-engine", icon: <Sparkles className="w-4 h-4" /> },
      { id: "soar-actions", label: "Response Actions", href: "/soar/actions", icon: <Zap className="w-4 h-4" />, badge: "16" },
      { id: "soar-approvals", label: "Approvals Queue", href: "/soar/approvals", icon: <CheckCircle2 className="w-4 h-4" />, badge: "3", badgeVariant: "warning" },
      { id: "soar-cases", label: "SOAR Cases", href: "/soar/cases", icon: <FolderKanban className="w-4 h-4" /> },
      { id: "soar-history", label: "Execution History", href: "/soar/history", icon: <Clock className="w-4 h-4" /> },
      { id: "soar-live", label: "Live Execution", href: "/soar/live", icon: <Radio className="w-4 h-4" /> },
      { id: "soar-reports", label: "Reports Hub", href: "/soar/reports", icon: <FileSpreadsheet className="w-4 h-4" /> },
      { id: "soar-simulation", label: "Simulation Lab", href: "/soar/simulation", icon: <FlaskConical className="w-4 h-4" /> },
      { id: "soar-settings", label: "SOAR Settings", href: "/soar/settings", icon: <Wrench className="w-4 h-4" /> },
    ],
  },
];

export interface SidebarProps {
  currentPath?: string;
  groups?: NavGroup[];
  isOpen?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export function Sidebar({
  currentPath = "/",
  groups = DEFAULT_NAV_GROUPS,
  isOpen = false,
  onCloseMobile,
  className,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        role={isOpen ? "dialog" : undefined}
        aria-label="Navigation sidebar"
        className={cn(
          "w-60 h-screen bg-[#0A0A0A] border-r border-white/[0.08] flex flex-col shrink-0 z-40 transition-transform duration-200 ease-in-out",
          "fixed lg:static top-0 left-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.08]">
          <a href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-[#5B0A0A] border border-[#E53935]/40 flex items-center justify-center font-bold text-white text-sm shadow-sm shadow-red-950/50">
              VS
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">VRSOC</h1>
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 mt-1">
                Enterprise Defense
              </p>
            </div>
          </a>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="lg:hidden text-white/50 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {groups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {group.title && (
                <h4 className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-white/30 mb-2">
                  {group.title}
                </h4>
              )}
              {group.items.map((item) => {
                const isActive = currentPath === item.href;

                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 select-none group",
                      isActive
                        ? "bg-[#5B0A0A]/70 text-white border-l-2 border-[#E53935] shadow-sm shadow-red-950/30"
                        : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={cn(isActive ? "text-[#E53935]" : "text-white/40 group-hover:text-white/70", "shrink-0")}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          "px-1.5 py-0.2 text-[10px] font-mono font-bold rounded shrink-0",
                          item.badgeVariant === "critical"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : item.badgeVariant === "warning"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : item.badgeVariant === "ai"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : isActive
                            ? "bg-[#E53935] text-white"
                            : "bg-white/10 text-white/50"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer Status */}
        <div className="p-3.5 border-t border-white/[0.08] bg-white/[0.01]">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-white/70">SOC ONLINE</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-[#E53935]" />
          </div>
        </div>
      </aside>
    </>
  );
}
