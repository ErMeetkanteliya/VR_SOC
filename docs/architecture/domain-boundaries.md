# VRSOC Architecture Constitution — Domain Boundaries

## 1. Document Overview

This document establishes the strict domain boundaries and encapsulation contracts across the VRSOC platform. To prevent monolithic spaghetti architecture and business logic duplication, all 28 distinct functional domains are formally specified with their responsibilities, owned concepts, inward/outward dependencies, public interfaces, and forbidden operations.

---

## 2. Domain Map & Dependency Graph

```text
                               ┌────────────────────────────────────────────────────────┐
                               │                 IDENTITY & TENANCY                     │
                               │        identity • organizations • teams • settings     │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │                 TELEMETRY & SENSORS                    │
                               │          assets • agents • telemetry • logs • fim      │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │                 DETECTION & INTELLIGENCE               │
                               │     detections • mitre • threat-intelligence • malware │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │                 SOC OPERATIONS & SOAR                  │
                               │  alerts • incidents • cases • investigations • soar    │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │           GOVERNANCE, LEARNING & AI EXTENSIONS         │
                               │ training • compliance • vulnerabilities • analytics    │
                               │           reports • notifications • api • ai • audit   │
                               └────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Domain Specifications

---

### 3.1 `identity` Domain
- **Responsibility**: User registration, session lifecycle, credential recovery, MFA challenges, and application profile metadata.
- **Owned Concepts**: `Profile`, `UserSession`, `MfaCredential`.
- **Dependencies**: Supabase Auth.
- **Public Interfaces**: `getProfile(userId)`, `updateProfile(userId, data)`, `verifyMfa(token)`.
- **Forbidden Responsibilities**: Cannot evaluate organization RBAC permissions or manage tenant assets.

---

### 3.2 `organizations` Domain
- **Responsibility**: Enterprise tenant management, membership records, role assignments, and invitation lifecycles.
- **Owned Concepts**: `Organization`, `Membership`, `Invitation`.
- **Dependencies**: `identity`.
- **Public Interfaces**: `getOrganization(orgId)`, `listMembers(orgId)`, `inviteMember(orgId, email, role)`, `getUserMembership(orgId, userId)`.
- **Forbidden Responsibilities**: Cannot manipulate operational telemetry or trigger incident actions directly.

---

### 3.3 `teams` Domain
- **Responsibility**: Sub-organizational grouping of users into SOC shifts, engineering units, or student cohorts.
- **Owned Concepts**: `Team`, `TeamMembership`.
- **Dependencies**: `organizations`, `identity`.
- **Public Interfaces**: `listTeams(orgId)`, `addTeamMember(teamId, userId)`.
- **Forbidden Responsibilities**: Cannot grant permissions exceeding the user's organization-level role.

---

### 3.4 `assets` Domain
- **Responsibility**: Monitored hardware, virtual machines, and cloud workload inventory; asset criticality; network metadata; isolation state.
- **Owned Concepts**: `Asset`, `AssetGroup`, `AssetContainment`.
- **Dependencies**: `organizations`.
- **Public Interfaces**: `listAssets(orgId, filter)`, `getAssetById(assetId)`, `setAssetIsolation(assetId, isIsolated, reason)`.
- **Forbidden Responsibilities**: Cannot parse raw telemetry streams or create detection rules.

---

### 3.5 `agents` Domain
- **Responsibility**: EDR sensor daemon health tracking, resource utilization metrics (CPU/RAM/Disk), heartbeat tracking, and remote agent commands.
- **Owned Concepts**: `Agent`, `AgentHeartbeat`, `AgentCommand`.
- **Dependencies**: `assets`, `organizations`.
- **Public Interfaces**: `listAgents(orgId)`, `recordHeartbeat(agentId, metrics)`, `dispatchAgentCommand(agentId, command)`.
- **Forbidden Responsibilities**: Cannot declare security incidents directly.

---

### 3.6 `telemetry` Domain
- **Responsibility**: Synthetic and ingested telemetry stream generation, normalization (ECS/OCSF alignment), and batch persistence.
- **Owned Concepts**: `TelemetryBatch`, `NormalizedEvent`, `TelemetryStream`.
- **Dependencies**: `assets`, `organizations`.
- **Public Interfaces**: `ingestTelemetry(orgId, rawEvents[])`, `normalizeEvent(rawEvent)`.
- **Forbidden Responsibilities**: Cannot decide if an event is malicious (delegated to `detections`).

---

### 3.7 `logs` Domain
- **Responsibility**: SIEM log exploration, high-throughput indexed searching, time-range querying, and JSON payload representation.
- **Owned Concepts**: `EventLog`, `SavedQuery`, `LogFacetFilter`.
- **Dependencies**: `telemetry`, `organizations`.
- **Public Interfaces**: `queryLogs(orgId, queryParams)`, `getLogById(logId)`.
- **Forbidden Responsibilities**: Cannot execute automated containment actions.

---

### 3.8 `detections` Domain
- **Responsibility**: Sigma rule management, YARA signatures, threshold evaluation, and mapping telemetry patterns to potential threats.
- **Owned Concepts**: `DetectionRule`, `RuleEvaluationMetric`.
- **Dependencies**: `telemetry`, `mitre`, `organizations`.
- **Public Interfaces**: `listRules(orgId)`, `createRule(data)`, `evaluateStream(events[])`.
- **Forbidden Responsibilities**: Cannot perform alert assignment or case note management.

---

### 3.9 `alerts` Domain
- **Responsibility**: Security alert triage, severity scoring, owner assignment, analyst commenting, and escalation state machine.
- **Owned Concepts**: `Alert`, `AlertComment`, `AlertHistory`.
- **Dependencies**: `detections`, `assets`, `mitre`, `organizations`.
- **Public Interfaces**: `listAlerts(orgId, filter)`, `acknowledgeAlert(alertId, userId)`, `escalateAlert(alertId, incidentData)`.
- **Forbidden Responsibilities**: Cannot execute playbook workflows directly (delegates to `soar`).

---

### 3.10 `incidents` Domain
- **Responsibility**: NIST SP 800-61 incident lifecycle orchestration (Detection -> Analysis -> Containment -> Eradication -> Recovery -> Lessons Learned -> Closed).
- **Owned Concepts**: `Incident`, `IncidentTask`, `IncidentTimelineEntry`.
- **Dependencies**: `alerts`, `assets`, `organizations`.
- **Public Interfaces**: `declareIncident(data)`, `transitionIncidentStage(incidentId, stage)`, `listIncidents(orgId)`.
- **Forbidden Responsibilities**: Cannot generate raw synthetic telemetry.

---

### 3.11 `cases` Domain
- **Responsibility**: Investigation dossier compilation, binding incidents, tagged evidence items, IOCs, and collaborative markdown notes.
- **Owned Concepts**: `Case`, `CaseEvidence`, `CaseNote`.
- **Dependencies**: `incidents`, `alerts`, `organizations`.
- **Public Interfaces**: `createCase(data)`, `addEvidence(caseId, evidenceItem)`, `addCaseNote(caseId, note)`.
- **Forbidden Responsibilities**: Cannot configure network firewall rules.

---

### 3.12 `investigations` & `threat-hunting` Domain
- **Responsibility**: Interactive hypothesis-driven hunting workspace, multi-dimensional timeline graphs, and attack path visualization.
- **Owned Concepts**: `HuntingHypothesis`, `AttackGraphNode`, `HuntingSession`.
- **Dependencies**: `logs`, `assets`, `threat-intelligence`, `cases`.
- **Public Interfaces**: `executeHuntingQuery(hypothesisQuery)`, `exportHuntingToCase(huntingId, caseId)`.
- **Forbidden Responsibilities**: Cannot modify production detection rules without explicit approval.

---

### 3.13 `mitre` Domain
- **Responsibility**: Canonical MITRE ATT&CK Enterprise Matrix repository, tactic coverage percentage calculations, and technique guidance.
- **Owned Concepts**: `MitreTactic`, `MitreTechnique`, `MitreMitigation`, `TenantCoverageScore`.
- **Dependencies**: `detections`, `organizations`.
- **Public Interfaces**: `getMatrixCoverage(orgId)`, `getTechniqueDetails(techniqueId)`.
- **Forbidden Responsibilities**: Cannot generate security alerts independently of `detections`.

---

### 3.14 `threat-intelligence` Domain
- **Responsibility**: Indicator of Compromise (IOC) lookups, external reputation caching (VirusTotal, AbuseIPDB, Shodan), and threat actor attribution.
- **Owned Concepts**: `ThreatIndicator`, `ReputationScore`, `IntelligenceFeed`.
- **Dependencies**: `organizations`.
- **Public Interfaces**: `lookupObservable(type, value)`, `enrichAlertIocs(alertId)`.
- **Forbidden Responsibilities**: Cannot store private user credentials.

---

### 3.15 `soar` Domain
- **Responsibility**: Automated response orchestration, 20+ playbook executions, Visual Playbook Builder node graph execution, human approval queues, and live execution logging.
- **Owned Concepts**: `Playbook`, `PlaybookExecution`, `ApprovalRequest`, `ResponseAction`.
- **Dependencies**: `alerts`, `assets`, `threat-intelligence`, `notifications`.
- **Public Interfaces**: `runPlaybook(playbookId, triggerPayload)`, `approveAction(approvalId, userId)`, `getExecutionLogs(executionId)`.
- **Forbidden Responsibilities**: Cannot bypass human approval requirements when policy demands it.

---

### 3.16 `training` Domain
- **Responsibility**: Educational lab scenarios, student investigation workflows, automated scoring engine, cohort rosters, and quiz evaluations.
- **Owned Concepts**: `SimulationScenario`, `Cohort`, `CohortAssignment`, `StudentSubmission`, `QuizResult`.
- **Dependencies**: `telemetry`, `alerts`, `cases`, `organizations`.
- **Public Interfaces**: `assignScenario(cohortId, scenarioId)`, `submitLab(submissionData)`, `gradeSubmission(submissionId, grade)`.
- **Forbidden Responsibilities**: Strictly prohibited from containing offensive exploit generators or live attack tools.

---

### 3.17 `compliance` Domain
- **Responsibility**: Regulatory framework scorecards (ISO 27001, NIST CSF, PCI DSS, HIPAA, CIS Controls) and automated telemetry evidence mapping.
- **Owned Concepts**: `ComplianceFramework`, `ComplianceControl`, `ControlEvidence`.
- **Dependencies**: `logs`, `assets`, `audit`, `organizations`.
- **Public Interfaces**: `getComplianceScorecard(orgId, frameworkId)`, `exportCompliancePackage(orgId)`.
- **Forbidden Responsibilities**: Cannot alter or delete raw audit logs.

---

### 3.18 `vulnerabilities` Domain
- **Responsibility**: Monitored asset CVE tracking, CVSS 3.1 severity metrics, exploit availability flags, and patch status tracking.
- **Owned Concepts**: `VulnerabilityRecord`, `AssetVulnerabilityMapping`.
- **Dependencies**: `assets`, `organizations`.
- **Public Interfaces**: `listVulnerabilities(orgId)`, `updatePatchStatus(vulnId, status)`.
- **Forbidden Responsibilities**: Cannot execute active vulnerability exploitation.

---

### 3.19 `malware` Domain
- **Responsibility**: Safe, simulated static analysis summaries (PE headers, hashes, digital signatures) and sandbox behavioral logs.
- **Owned Concepts**: `MalwareSampleRecord`, `SandboxReport`.
- **Dependencies**: `mitre`, `threat-intelligence`, `organizations`.
- **Public Interfaces**: `getSampleReport(sampleId)`, `searchByHash(hashValue)`.
- **Forbidden Responsibilities**: Strictly forbidden from compiling or distributing executable malware binaries.

---

### 3.20 `fim` (File Integrity Monitoring) Domain
- **Responsibility**: Real-time monitoring of file creations, modifications, deletions, and permission changes across critical monitored paths.
- **Owned Concepts**: `FimMonitoredPath`, `FimEvent`.
- **Dependencies**: `assets`, `telemetry`, `organizations`.
- **Public Interfaces**: `listFimEvents(orgId, filter)`, `configureMonitoredPath(pathConfig)`.
- **Forbidden Responsibilities**: Cannot alter local filesystem files on actual host servers.

---

### 3.21 `analytics` Domain
- **Responsibility**: Real-time computation of SOC KPIs (MTTD, MTTR, closure rates, false positive ratios, severity trends).
- **Owned Concepts**: `KpiSnapshot`, `TimeseriesAggregation`.
- **Dependencies**: `alerts`, `incidents`, `logs`, `agents`, `organizations`.
- **Public Interfaces**: `getDashboardMetrics(orgId, timeRange)`, `getThreatTrends(orgId)`.
- **Forbidden Responsibilities**: Cannot store persistent operational state.

---

### 3.22 `reports` Domain
- **Responsibility**: Structured document compilation and export (PDF, CSV, JSON) for Executive Summaries, Technical Incident Dossiers, and GRC audits.
- **Owned Concepts**: `ReportTemplate`, `GeneratedReport`, `ReportDownloadToken`.
- **Dependencies**: `analytics`, `incidents`, `compliance`, `Supabase Storage`.
- **Public Interfaces**: `generateReport(orgId, templateId, params)`, `getReportDownloadUrl(reportId)`.
- **Forbidden Responsibilities**: Cannot expose unauthenticated public download links for tenant reports.

---

### 3.23 `notifications` Domain
- **Responsibility**: Multi-channel notification delivery (In-App toasts, SMTP emails, Slack webhooks, Microsoft Teams alerts).
- **Owned Concepts**: `NotificationMessage`, `NotificationChannelConfig`.
- **Dependencies**: `organizations`.
- **Public Interfaces**: `dispatchNotification(orgId, notificationPayload)`.
- **Forbidden Responsibilities**: Cannot store business operational logic.

---

### 3.24 `api` Domain
- **Responsibility**: Programmatic REST API endpoints, API key authentication, permission scope validation, and rate limiting.
- **Owned Concepts**: `ApiKey`, `ApiUsageMetric`.
- **Dependencies**: `organizations`, `all domain services`.
- **Public Interfaces**: `validateApiKey(keyToken)`, `recordApiUsage(keyId)`.
- **Forbidden Responsibilities**: Cannot bypass organization RLS policies.

---

### 3.25 `ai` Domain
- **Responsibility**: Context-grounded RAG cyber education assistant, query explanation, and defensive guidance.
- **Owned Concepts**: `AiConversation`, `AiMessage`, `PromptContextDossier`.
- **Dependencies**: `alerts`, `logs`, `mitre`, `assets`, `knowledge`.
- **Public Interfaces**: `streamAiExplanation(alertContext, query)`.
- **Forbidden Responsibilities**: Prohibited from providing offensive exploit compilation or ungrounded generic chat.

---

### 3.26 `audit` Domain
- **Responsibility**: Immutable, append-only security and administrative audit event logging.
- **Owned Concepts**: `AuditEvent`.
- **Dependencies**: `organizations`, `identity`.
- **Public Interfaces**: `recordAuditEvent(auditPayload)`, `listAuditEvents(orgId, filter)`.
- **Forbidden Responsibilities**: Prohibited from allowing `UPDATE` or `DELETE` operations on audit logs.

---

### 3.27 `settings` Domain
- **Responsibility**: Organization preferences, security policies (MFA enforcement), notification webhook configurations, and UI appearance.
- **Owned Concepts**: `OrganizationSettings`, `UserSettings`.
- **Dependencies**: `organizations`, `identity`.
- **Public Interfaces**: `getSettings(orgId)`, `updateSettings(orgId, data)`.
- **Forbidden Responsibilities**: Cannot alter system-level database configurations.

---

### 3.28 `shared` Domain
- **Responsibility**: Core design system tokens, AppShell layout primitives, shared TypeScript types, utility helpers, and common Zod validation schemas.
- **Owned Concepts**: `AppShell`, `Sidebar`, `Topbar`, `DataTable`, `Modal`, `Drawer`, `SeverityBadge`, `DesignTokens`.
- **Dependencies**: None.
- **Forbidden Responsibilities**: Contains zero business logic or domain database queries.
