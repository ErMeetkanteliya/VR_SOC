import { cn } from "../utils";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1.5 text-xs", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center space-x-1.5">
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />}
            {isLast || !item.href ? (
              <span className={cn("font-medium", isLast ? "text-white" : "text-white/50")}>
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                className="text-white/50 hover:text-white transition-colors duration-150"
              >
                {item.label}
              </a>
            )}
          </div>
        );
      })}
    </nav>
  );
}
