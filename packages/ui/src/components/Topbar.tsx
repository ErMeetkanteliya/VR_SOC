import { cn } from "../utils";
import { Search, Bell, Menu, ChevronDown, Building2 } from "lucide-react";
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";
import { IconButton } from "./IconButton";

export interface TopbarProps {
  breadcrumbs?: BreadcrumbItem[];
  organizationName?: string;
  userEmail?: string;
  notificationsCount?: number;
  onMenuToggle?: () => void;
  onSearchClick?: () => void;
  className?: string;
}

export function Topbar({
  breadcrumbs = [{ label: "Dashboard" }],
  organizationName = "Cyber Defense Academy",
  userEmail = "analyst@vrsoc.app",
  notificationsCount = 3,
  onMenuToggle,
  onSearchClick,
  className,
}: TopbarProps) {
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
            aria-label="Toggle Navigation"
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
            className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/40 hover:text-white hover:border-white/20 transition-all duration-150"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Quick search...</span>
            <kbd className="text-[10px] font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
              Ctrl+K
            </kbd>
          </button>
        )}

        {/* Organization Switcher Dropdown Preview */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-white/80 cursor-pointer hover:bg-white/[0.06] transition-colors">
          <Building2 className="w-3.5 h-3.5 text-[#E53935]" />
          <span className="font-medium max-w-[140px] truncate">{organizationName}</span>
          <ChevronDown className="w-3 h-3 text-white/40" />
        </div>

        {/* Notifications Bell with Badge */}
        <div className="relative">
          <IconButton label="Notifications" variant="ghost" size="sm">
            <Bell className="w-4 h-4 text-white/70" />
          </IconButton>
          {notificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E53935] ring-2 ring-[#0A0A0A]" />
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-[#5B0A0A] border border-[#E53935]/40 flex items-center justify-center text-xs font-bold text-white uppercase select-none">
            {userEmail.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
