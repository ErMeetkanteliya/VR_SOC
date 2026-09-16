# VRSOC Phase 00 — Unknowns & Black-Box Boundary

In accordance with Section 5 of `VR_SOC.md`, this document explicitly lists all aspects of the Base44 application that are unobservable and must remain classified as **UNKNOWN**.

---

## 1. Catalog of Unknowns

1. **Base44 Private Backend Technology Stack**:
   - *Status*: UNKNOWN
   - *Details*: The server runtime (Node, Go, Python, or proprietary Base44 serverless platform) handling backend entity resolution is black-box.
   - *Resolution*: Target architecture uses Next.js + TypeScript + Supabase + PostgreSQL.

2. **Internal Database Schema & Indexes**:
   - *Status*: UNKNOWN
   - *Details*: The underlying database engine, table schemas, foreign key constraints, and indexing strategies within Base44's cloud infrastructure are unobservable.
   - *Resolution*: We design an idiomatic, normalized PostgreSQL schema with explicit foreign keys, indexes, and RLS policies.

3. **Background Worker / Queue Implementation**:
   - *Status*: UNKNOWN
   - *Details*: How asynchronous jobs or scheduled tasks (if any existed on the backend) were queued or executed.
   - *Resolution*: Target architecture uses Supabase Edge Functions, database triggers, and pg_cron for background task execution.

4. **Multi-Tenant Partitioning Strategy**:
   - *Status*: UNKNOWN
   - *Details*: Whether Base44 partitioned tenants at the database, schema, or row level.
   - *Resolution*: Target architecture standardizes on row-level tenant isolation using PostgreSQL Row Level Security (RLS) and `organization_id` foreign keys.

5. **AI Integration Backend & Model Parameters**:
   - *Status*: UNKNOWN
   - *Details*: Which underlying model (GPT-4o, Claude 3.5 Sonnet, Gemini Pro), temperature, token limits, and rate limiters were configured behind `Je.integrations.Core.InvokeLLM`.
   - *Resolution*: Target architecture builds a dedicated Supabase Edge Function integrating Google Gemini / Anthropic models with custom defensive cybersecurity system prompts and structured tool calling.
