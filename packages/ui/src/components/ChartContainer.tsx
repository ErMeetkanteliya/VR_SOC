import React from "react";
import { cn } from "../utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./Card";

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function ChartContainer({
  title,
  description,
  actions,
  children,
  className,
  ...props
}: ChartContainerProps) {
  return (
    <Card variant="glass" className={cn("flex flex-col", className)} {...props}>
      <CardHeader className="border-b border-white/5 pb-4">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className="p-5 flex-1 flex flex-col justify-center min-h-[220px]">
        {children}
      </CardContent>
    </Card>
  );
}
