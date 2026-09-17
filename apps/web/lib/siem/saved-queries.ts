/**
 * Phase 14: SIEM Core — Saved Queries Service
 *
 * Provides tenant-scoped management of saved SIEM search and filter configurations.
 * Saves query definitions (never result payloads) for safe, repeatable investigation workflows.
 *
 * Implements:
 * - Multi-tenant isolation via organization_id and PostgreSQL RLS
 * - Input validation with Zod
 * - Zero arbitrary SQL or user-controlled database execution
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SavedQuery, CreateSavedQueryInput } from "@vrsoc/types";
import type { UpdateSavedQueryInput } from "@vrsoc/validation";

/**
 * Retrieves all saved queries for an organization.
 */
export async function getSavedQueries(
  organizationId: string,
  queryType?: "events" | "logs" | "correlated"
): Promise<SavedQuery[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("saved_queries")
    .select("*")
    .eq("organization_id", organizationId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (queryType) {
    query = query.eq("query_type", queryType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getSavedQueries] Query error:", error);
    return [];
  }

  return (data as SavedQuery[]) || [];
}

/**
 * Creates a new saved query within an organization.
 */
export async function createSavedQuery(
  organizationId: string,
  userId: string | null,
  input: CreateSavedQueryInput
): Promise<{ success: boolean; data?: SavedQuery; error?: string }> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("saved_queries")
    .insert({
      organization_id: organizationId,
      user_id: userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      query_type: input.queryType || "events",
      filters: input.filters,
      is_pinned: input.isPinned || false,
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    console.error("[createSavedQuery] Insert error:", error);
    return { success: false, error: error?.message || "Failed to save query." };
  }

  return { success: true, data: data as SavedQuery };
}

/**
 * Updates a saved query's name, description, filters, or pinned status.
 */
export async function updateSavedQuery(
  organizationId: string,
  input: UpdateSavedQueryInput
): Promise<{ success: boolean; data?: SavedQuery; error?: string }> {
  const supabase = await createServerSupabaseClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.description !== undefined) updates.description = input.description.trim();
  if (input.isPinned !== undefined) updates.is_pinned = input.isPinned;
  if (input.filters !== undefined) updates.filters = input.filters;

  const { data, error } = await supabase
    .from("saved_queries")
    .update(updates)
    .eq("id", input.id)
    .eq("organization_id", organizationId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    console.error("[updateSavedQuery] Update error:", error);
    return { success: false, error: error?.message || "Failed to update saved query." };
  }

  return { success: true, data: data as SavedQuery };
}

/**
 * Deletes a saved query scoped to an organization.
 */
export async function deleteSavedQuery(
  organizationId: string,
  queryId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("saved_queries")
    .delete()
    .eq("id", queryId)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("[deleteSavedQuery] Delete error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
