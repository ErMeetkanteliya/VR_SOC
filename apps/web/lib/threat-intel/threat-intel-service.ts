import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeIoc } from "./normalization";
import {
  CANONICAL_THREAT_INDICATORS,
  CANONICAL_IOC_RELATIONSHIPS,
  calculateIocOverviewStats,
} from "./catalog";
import type {
  ThreatIndicator,
  ThreatIndicatorDetail,
  IocRelationship,
  IocFilter,
  IocOverviewStats,
  CreateIocInput,
  UpdateIocInput,
  CreateIocRelationshipInput,
  IocRelationshipTargetType,
} from "@vrsoc/types";

// In-memory development store for created/updated IOCs when database is offline
const inMemoryIndicators = new Map<string, ThreatIndicator>();
const inMemoryRelationships = new Map<string, IocRelationship>();

// Seed initial memory store
for (const ioc of CANONICAL_THREAT_INDICATORS) {
  inMemoryIndicators.set(ioc.id, { ...ioc });
}
for (const rel of CANONICAL_IOC_RELATIONSHIPS) {
  inMemoryRelationships.set(rel.id, { ...rel });
}

/**
 * Retrieves paginated and filtered Threat Indicators
 */
export async function getThreatIndicators(
  filter: IocFilter = {},
  organizationId?: string
): Promise<{ indicators: ThreatIndicator[]; total: number; page: number; pageSize: number }> {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 25;

  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("iocs").select("*", { count: "exact" });

    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},is_global.eq.true`);
    }

    if (filter.ioc_type && filter.ioc_type !== "all") {
      query = query.eq("ioc_type", filter.ioc_type);
    }

    if (filter.severity && filter.severity !== "all") {
      query = query.eq("severity", filter.severity);
    }

    if (filter.status && filter.status !== "all") {
      query = query.eq("status", filter.status);
    }

    if (filter.source && filter.source !== "all") {
      query = query.eq("source", filter.source);
    }

    if (filter.search && filter.search.trim()) {
      const s = filter.search.trim();
      query = query.or(`normalized_value.ilike.%${s}%,raw_value.ilike.%${s}%,description.ilike.%${s}%`);
    }

    const sortField = filter.sortBy || "last_seen";
    const isAsc = filter.sortOrder === "asc";
    query = query.order(sortField, { ascending: isAsc });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error || !data) throw error || new Error("Failed to load IOCs from database");

    return {
      indicators: data as ThreatIndicator[],
      total: count || data.length,
      page,
      pageSize,
    };
  } catch {
    // Development fallback using in-memory / canonical catalog
    let all = Array.from(inMemoryIndicators.values());

    if (organizationId) {
      all = all.filter((i) => i.organization_id === organizationId || i.is_global);
    }

    if (filter.ioc_type && filter.ioc_type !== "all") {
      all = all.filter((i) => i.ioc_type === filter.ioc_type);
    }

    if (filter.severity && filter.severity !== "all") {
      all = all.filter((i) => i.severity === filter.severity);
    }

    if (filter.status && filter.status !== "all") {
      all = all.filter((i) => i.status === filter.status);
    }

    if (filter.source && filter.source !== "all") {
      all = all.filter((i) => i.source === filter.source);
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      all = all.filter(
        (i) =>
          i.normalized_value.toLowerCase().includes(q) ||
          i.raw_value.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)) ||
          i.threat_types.some((tt) => tt.toLowerCase().includes(q))
      );
    }

    // Sorting
    const sortField = filter.sortBy || "last_seen";
    const isAsc = filter.sortOrder === "asc";
    all.sort((a, b) => {
      let valA: unknown = a[sortField as keyof ThreatIndicator];
      let valB: unknown = b[sortField as keyof ThreatIndicator];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if ((valA ?? 0) < (valB ?? 0)) return isAsc ? -1 : 1;
      if ((valA ?? 0) > (valB ?? 0)) return isAsc ? 1 : -1;
      return 0;
    });

    const total = all.length;
    const from = (page - 1) * pageSize;
    const paginated = all.slice(from, from + pageSize);

    return {
      indicators: paginated,
      total,
      page,
      pageSize,
    };
  }
}

/**
 * Retrieves a single Threat Indicator with full forensic relationships
 */
export async function getThreatIndicatorById(
  id: string,
  organizationId?: string
): Promise<ThreatIndicatorDetail | null> {
  let indicator: ThreatIndicator | null = null;
  let relationships: IocRelationship[] = [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data: iocData, error: iocError } = await supabase
      .from("iocs")
      .select("*")
      .eq("id", id)
      .single();

    if (!iocError && iocData) {
      indicator = iocData as ThreatIndicator;
      const { data: relData } = await supabase
        .from("ioc_relationships")
        .select("*")
        .eq("ioc_id", id);
      if (relData) relationships = relData as IocRelationship[];
    }
  } catch {
    // Development fallback
  }

  if (!indicator) {
    indicator = inMemoryIndicators.get(id) || null;
    if (indicator) {
      relationships = Array.from(inMemoryRelationships.values()).filter((r) => r.ioc_id === id);
    }
  }

  if (!indicator) return null;

  if (organizationId && indicator.organization_id !== organizationId && !indicator.is_global) {
    return null;
  }

  // Calculate relationship counters
  const counts = {
    events: relationships.filter((r) => r.target_type === "event").length,
    alerts: relationships.filter((r) => r.target_type === "alert").length,
    incidents: relationships.filter((r) => r.target_type === "incident").length,
    cases: relationships.filter((r) => r.target_type === "case").length,
    assets: relationships.filter((r) => r.target_type === "asset").length,
    malware: relationships.filter((r) => r.target_type === "malware").length,
  };

  return {
    ...indicator,
    relationships,
    relationships_count: counts,
  };
}

/**
 * Finds a Threat Indicator by normalized value (e.g. for log/alert ingestion correlation)
 */
export async function getThreatIndicatorByValue(
  value: string,
  organizationId?: string
): Promise<ThreatIndicator | null> {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase();

  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("iocs").select("*").eq("normalized_value", cleaned);
    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},is_global.eq.true`);
    }
    const { data, error } = await query.limit(1).maybeSingle();
    if (!error && data) return data as ThreatIndicator;
  } catch {
    // Development fallback
  }

  for (const ioc of inMemoryIndicators.values()) {
    if (
      ioc.normalized_value.toLowerCase() === cleaned &&
      (!organizationId || ioc.organization_id === organizationId || ioc.is_global)
    ) {
      return ioc;
    }
  }

  return null;
}

/**
 * Creates a new Threat Indicator with automatic normalization and validation
 */
export async function createThreatIndicator(
  input: CreateIocInput,
  organizationId: string
): Promise<ThreatIndicator> {
  const norm = normalizeIoc(input.ioc_type, input.value, input.hash_type);
  if (!norm.isValid) {
    throw new Error(norm.error || `Invalid ${input.ioc_type} format: "${input.value}"`);
  }

  const now = new Date().toISOString();
  const id = `ioc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const indicator: ThreatIndicator = {
    id,
    organization_id: organizationId,
    ioc_type: norm.iocType,
    normalized_value: norm.normalizedValue,
    raw_value: norm.rawValue,
    hash_type: norm.hashType || null,
    ip_version: norm.ipVersion || null,
    confidence: input.confidence ?? 80,
    severity: input.severity || "medium",
    threat_types: input.threat_types || [],
    source: input.source || "manual",
    tags: input.tags || [],
    description: input.description || "",
    first_seen: input.first_seen || now,
    last_seen: input.last_seen || now,
    status: input.status || "active",
    is_global: false,
    metadata: input.metadata || {},
    created_at: now,
    updated_at: now,
  };

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("iocs").insert(indicator).select().single();
    if (!error && data) {
      inMemoryIndicators.set(data.id, data as ThreatIndicator);
      return data as ThreatIndicator;
    }
  } catch {
    // Fallback to local memory persistence
  }

  inMemoryIndicators.set(indicator.id, indicator);
  return indicator;
}

/**
 * Updates an existing Threat Indicator
 */
export async function updateThreatIndicator(
  input: UpdateIocInput,
  organizationId: string
): Promise<ThreatIndicator> {
  const now = new Date().toISOString();

  try {
    const supabase = await createServerSupabaseClient();
    const updatePayload: Record<string, unknown> = {
      updated_at: now,
    };
    if (input.confidence !== undefined) updatePayload.confidence = input.confidence;
    if (input.severity) updatePayload.severity = input.severity;
    if (input.threat_types) updatePayload.threat_types = input.threat_types;
    if (input.tags) updatePayload.tags = input.tags;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.status) updatePayload.status = input.status;
    if (input.last_seen) updatePayload.last_seen = input.last_seen;
    if (input.metadata) updatePayload.metadata = input.metadata;

    const { data, error } = await supabase
      .from("iocs")
      .update(updatePayload)
      .eq("id", input.id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (!error && data) {
      inMemoryIndicators.set(data.id, data as ThreatIndicator);
      return data as ThreatIndicator;
    }
  } catch {
    // Development fallback
  }

  const existing = inMemoryIndicators.get(input.id);
  if (!existing) {
    throw new Error(`Threat Indicator "${input.id}" not found.`);
  }

  const updated: ThreatIndicator = {
    ...existing,
    confidence: input.confidence !== undefined ? input.confidence : existing.confidence,
    severity: input.severity || existing.severity,
    threat_types: input.threat_types || existing.threat_types,
    tags: input.tags || existing.tags,
    description: input.description !== undefined ? input.description : existing.description,
    status: input.status || existing.status,
    last_seen: input.last_seen || now,
    metadata: input.metadata ? { ...existing.metadata, ...input.metadata } : existing.metadata,
    updated_at: now,
  };

  inMemoryIndicators.set(updated.id, updated);
  return updated;
}

/**
 * Deletes a Threat Indicator
 */
export async function deleteThreatIndicator(
  id: string,
  organizationId: string
): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("iocs")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId);
    if (!error) {
      inMemoryIndicators.delete(id);
      return true;
    }
  } catch {
    // Fallback
  }

  inMemoryIndicators.delete(id);
  return true;
}

/**
 * Calculates Threat Intelligence KPI stats
 */
export async function getIocOverviewStats(organizationId?: string): Promise<IocOverviewStats> {
  const result = await getThreatIndicators({ pageSize: 500 }, organizationId);
  const rels = Array.from(inMemoryRelationships.values());
  return calculateIocOverviewStats(result.indicators, rels);
}

/**
 * Retrieves all relationships for a given IOC
 */
export async function getIocRelationships(
  iocId: string,
  organizationId?: string
): Promise<IocRelationship[]> {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("ioc_relationships").select("*").eq("ioc_id", iocId);
    if (organizationId) query = query.eq("organization_id", organizationId);
    const { data, error } = await query;
    if (!error && data) return data as IocRelationship[];
  } catch {
    // Development fallback
  }

  return Array.from(inMemoryRelationships.values()).filter(
    (r) => r.ioc_id === iocId && (!organizationId || r.organization_id === organizationId)
  );
}

/**
 * Creates a relationship linking an IOC to an event, alert, incident, case, asset, or malware
 */
export async function createIocRelationship(
  input: CreateIocRelationshipInput,
  organizationId: string
): Promise<IocRelationship> {
  const now = new Date().toISOString();
  const id = `rel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const relationship: IocRelationship = {
    id,
    organization_id: organizationId,
    ioc_id: input.ioc_id,
    target_type: input.target_type,
    target_id: input.target_id,
    relationship_type: input.relationship_type || "observed_in",
    context: input.context || {},
    first_seen: now,
    last_seen: now,
    created_at: now,
  };

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("ioc_relationships")
      .insert(relationship)
      .select()
      .single();
    if (!error && data) {
      inMemoryRelationships.set(data.id, data as IocRelationship);
      return data as IocRelationship;
    }
  } catch {
    // Fallback
  }

  inMemoryRelationships.set(relationship.id, relationship);
  return relationship;
}

/**
 * Batch enrichment helper: takes a list of candidate strings (IPs, hashes, domains)
 * and resolves them against the threat intelligence repository
 */
export async function enrichEntityIocs(
  targetType: IocRelationshipTargetType,
  targetId: string,
  values: string[],
  organizationId?: string
): Promise<ThreatIndicator[]> {
  const matched: ThreatIndicator[] = [];

  for (const val of values) {
    if (!val || typeof val !== "string") continue;
    const found = await getThreatIndicatorByValue(val, organizationId);
    if (found) {
      matched.push(found);
      if (organizationId) {
        // Link sighting asynchronously
        await createIocRelationship(
          {
            ioc_id: found.id,
            target_type: targetType,
            target_id: targetId,
            relationship_type: "observed_in",
          },
          organizationId
        ).catch(() => {});
      }
    }
  }

  return matched;
}
