"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import {
  CreateOrganizationSchema,
  InviteMemberSchema,
  type CreateOrganizationInput,
  type InviteMemberInput,
} from "@vrsoc/validation";
import type { Organization, Membership, UserRole } from "@vrsoc/types";

export interface TenantActionResult<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

const ACTIVE_ORG_COOKIE = "vrsoc_active_org";

/**
 * Resolves the active organization ID from request cookies or retrieves the first active membership.
 */
export async function getActiveOrganization(): Promise<{ organization: Organization | null; role: UserRole | null }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { organization: null, role: null };

    const cookieStore = cookies();
    const preferredOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

    // Fetch user's active memberships
    const { data: memberships } = await supabase
      .from("memberships")
      .select(`
        id,
        role,
        status,
        organization:organizations (
          id,
          name,
          slug,
          status,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "active");

    if (!memberships || memberships.length === 0) {
      return { organization: null, role: null };
    }

    // Try matching preferred org ID from cookie
    if (preferredOrgId) {
      const match = memberships.find((m) => (m.organization as any)?.id === preferredOrgId);
      if (match && match.organization) {
        return {
          organization: match.organization as unknown as Organization,
          role: match.role as UserRole,
        };
      }
    }

    // Fallback to first active membership
    const primary = memberships[0];
    return {
      organization: primary?.organization as unknown as Organization,
      role: (primary?.role as UserRole) || null,
    };
  } catch {
    return { organization: null, role: null };
  }
}

/**
 * Creates a new Organization and provisions creator as Super Admin membership.
 */
export async function createOrganizationAction(input: CreateOrganizationInput): Promise<TenantActionResult<Organization>> {
  const parsed = CreateOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid organization details",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Call transactional PostgreSQL function
    const { data, error } = await supabase.rpc("create_organization", {
      org_name: parsed.data.name,
      org_slug: parsed.data.slug,
    });

    if (error) {
      return { success: false, error: error.message || "Failed to create organization" };
    }

    const orgId = data?.organization_id;
    if (orgId) {
      const cookieStore = cookies();
      cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    }

    return {
      success: true,
      data: {
        id: data.organization_id,
        name: data.name,
        slug: data.slug,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to provision organization",
    };
  }
}

/**
 * Switch active organization context with server-side membership verification.
 */
export async function switchOrganizationAction(organizationId: string): Promise<TenantActionResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify user is an active member of target organization
    const { data: membership, error } = await supabase
      .from("memberships")
      .select("id, status")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (error || !membership) {
      return {
        success: false,
        error: "Access denied: You are not an active member of this organization",
      };
    }

    // Set cookie on server
    const cookieStore = cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    return { success: true };
  } catch {
    return { success: false, error: "Unable to switch organization" };
  }
}

/**
 * List all active organizations for current user.
 */
export async function listUserOrganizationsAction(): Promise<TenantActionResult<Membership[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("memberships")
      .select(`
        id,
        organization_id,
        user_id,
        role,
        status,
        created_at,
        updated_at,
        organization:organizations (*)
      `)
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as unknown) as Membership[] };
  } catch {
    return { success: false, error: "Failed to load organizations" };
  }
}

/**
 * Invite a user to the current organization.
 */
export async function inviteMemberAction(input: InviteMemberInput): Promise<TenantActionResult> {
  const parsed = InviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await supabase.from("invitations").insert({
      organization_id: parsed.data.organizationId,
      email: parsed.data.email,
      role: parsed.data.role,
      invited_by: user.id,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Failed to dispatch invitation" };
  }
}
