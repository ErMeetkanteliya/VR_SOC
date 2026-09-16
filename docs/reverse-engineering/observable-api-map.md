# VRSOC Phase 00 — Observable API Map

## 1. Observable Base44 Client Calls

The Base44 client interacts via a high-level SDK interface (`Je.entities`, `Je.auth`, `Je.integrations`). The following network interaction patterns were observed:

| Base44 SDK Call | Observable Endpoint / Target | HTTP Method | Purpose | Target Supabase Equivalent |
|---|---|---|---|---|
| `Je.auth.me()` | `/entities/User/me` | `GET` | Fetch active user profile and session verification | `supabase.auth.getUser()` + `supabase.from('profiles').select()` |
| `Je.auth.loginViaEmailPassword(email, pass)` | `/auth/login` | `POST` | Exchange credentials for bearer JWT | `supabase.auth.signInWithPassword()` |
| `Je.auth.register({ email, password })` | `/auth/register` | `POST` | Register account and trigger email OTP | `supabase.auth.signUp()` |
| `Je.auth.verifyOtp({ email, otpCode })` | `/auth/verify-otp` | `POST` | Validate 6-digit OTP code | `supabase.auth.verifyOtp()` |
| `Je.auth.resetPasswordRequest(email)` | `/auth/password-reset` | `POST` | Send reset link | `supabase.auth.resetPasswordForEmail()` |
| `Je.entities.Alert.list("-created_date", 50)` | `/entities/Alert?sort=-created_date&limit=50` | `GET` | List active alerts with sorting | `supabase.from('alerts').select().order('created_at', { ascending: false }).limit(50)` |
| `Je.entities.Incident.create(data)` | `/entities/Incident` | `POST` | Create incident / case | `supabase.from('incidents').insert(data)` |
| `Je.entities.Incident.update(id, data)` | `/entities/Incident/:id` | `PATCH` | Update incident status or notes | `supabase.from('incidents').update(data).eq('id', id)` |
| `Je.entities.SOARPlaybook.list()` | `/entities/SOARPlaybook` | `GET` | Fetch playbooks | `supabase.from('soar_playbooks').select()` |
| `Je.entities.SOARApproval.update(id, data)` | `/entities/SOARApproval/:id` | `PATCH` | Approve/reject SOAR action | `supabase.from('soar_approvals').update(data).eq('id', id)` |
| `Je.integrations.Core.InvokeLLM({ prompt })` | `/integrations/llm/invoke` | `POST` | Stream/fetch AI Assistant response | Supabase Edge Function `functions/v1/ai-assistant` |

---

## 2. Target Production API Design

In the target Next.js + Supabase architecture:
1. **Client Read/Write Operations**: Handled directly via Supabase Client protected by Row Level Security (RLS) policies.
2. **Privileged Operations (Simulation, Ingestion, SOAR Execution)**: Handled via Next.js Server Actions and Supabase Edge Functions:
   - `POST /api/simulation/launch`: Runs server-side scenario orchestration.
   - `POST /api/telemetry/ingest`: Normalized log stream ingestion.
   - `POST /api/soar/execute`: Asynchronous playbook runner with approval gates.
   - `POST /api/ai/chat`: Streaming grounded conversational assistant.
