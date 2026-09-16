"use client";

import React from "react";
import { hasPermission } from "./permissions";
import type { Permission, UserRole } from "@vrsoc/types";

export interface CanProps {
  role?: UserRole | string | null;
  perform: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client-Side Authorization Component.
 * 
 * IMPORTANT: This component is purely for UX presentation (e.g. conditional rendering
 * or hiding controls). It is NOT a security boundary. All privileged actions must be
 * validated server-side and at the PostgreSQL RLS layer.
 */
export function Can({ role, perform, children, fallback = null }: CanProps) {
  const allowed = hasPermission(role as UserRole, perform);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Client-Side Hook for checking permission based on active role context.
 */
export function useHasPermission(
  role: UserRole | string | undefined | null,
  permission: Permission
): boolean {
  return hasPermission(role as UserRole, permission);
}
