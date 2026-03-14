# Takhet+ Backend/Frontend Integration Audit (against full product overview)

Date: 2026-03-14

## 1) Audit method (what was checked)
- Route inventory from NestJS controllers.
- Runtime build/type checks for frontend and backend.
- Frontend API adapter and backend integration points.
- Feature coverage mapping vs requested full ecosystem overview (Patient, Doctor, Legal, Operations, Logistics).

## 2) Current implementation coverage summary

### Overall readiness estimate
- **Backend platform core:** ~35%
- **Patient features:** ~20%
- **Doctor features:** ~25%
- **Payments & finance:** ~25%
- **Documents & legal-grade workflows (ЭЦП, compliance):** ~15%
- **Integrations (labs/pharmacy/delivery/insurance):** ~5%
- **End-to-end closed-loop ecosystem (AI→Doctor→Pharmacy→Delivery→Monitoring):** ~10%

> Total weighted project readiness for the full overview: **~22%**.

## 3) What is already present in codebase (implemented now)

### Implemented backend modules/endpoints
- Auth login and JWT guard baseline.
- Triage endpoint and AI service wrapper.
- Cases CRUD-like flow (create/my/respond/close).
- Doctor role endpoints: dashboard, queue, appointments, profile, earnings.
- Partner/admin/patient role endpoints (basic dashboards/lists/actions).
- Payments: create-intent + webhook scaffold.
- Files upload endpoint to Supabase object storage.
- Notifications and audit entities/services baseline.
- Public doctors endpoint for marketplace listing.
- Health endpoint (`GET /health`) for service liveness.

### Implemented frontend integration
- Central API client + role-specific API wrapper.
- Backend status indicator in app layout.
- Multiple pages switched from pure mocks to API-first with fallback behavior.

## 4) Gap analysis vs requested full overview

## I. Patient features

### 1) Profile & EMR
- Present: basic case history and file upload hooks.
- Missing for full scope:
  - structured medical profile (анамнез/allergies/chronic conditions) domain model + CRUD;
  - family profiles (children/parents) + consent model;
  - complete EMR timeline model (visits, labs, conclusions, prescriptions) with immutable event sourcing;
  - prescription history as first-class entity.

### 2) Diagnostics & AI
- Present: triage baseline endpoint.
- Missing:
  - image-analysis pipelines (skin/MRI/CT/ECG/EEG/lab parsing);
  - risk scoring engine + deterioration prediction + trajectory monitoring;
  - mental-state AI model pipeline;
  - personalized assistant with memory/RAG over patient history;
  - strict “recommendation-only” policy layer and explainability logs.

### 3) Consultations
- Present: partial chat/consultation UI level and case routing APIs.
- Missing:
  - production telemedicine RTC signaling/media infra;
  - offline appointment booking with slot engine;
  - urgent call queue/SLA routing;
  - one-click follow-up revisit workflow;
  - durable conversation history model with retention policy.

### 4) Treatment & prescriptions
- Present: payments/files fragments only.
- Missing:
  - e-prescription generation lifecycle;
  - physician digital signature workflow for documents;
  - pharmacy dispatch API and status callbacks;
  - Wolt integration for delivery + courier tracking;
  - treatment/prophylaxis plan engines with milestones and adherence tracking.

### 5) Finance
- Present: payment intent + webhook scaffold, payment listing.
- Missing:
  - subscription billing (doctor / prevention plans);
  - bundles/packages/instalments;
  - insurance claims & policy integration;
  - internal points/cashback ledger (non-withdrawable) with anti-fraud;
  - finance reconciliation/ledger accounting module.

### 6) Documents
- Present: file storage only.
- Missing:
  - medical document templates and lifecycle states;
  - sick leave certificates and legal record retention;
  - full digital signature chain + timestamping + verification APIs;
  - downloadable/verifiable signed artifacts.

### 7) Personalization
- Missing almost entirely:
  - personalized care journey orchestrator;
  - AI reminders/risk notifications;
  - individualized recommendations engine;
  - digital twin progression model.

### 8) Education/content
- Missing:
  - CMS/content feeds/news/courses/webinars;
  - personalization and TG private channel access workflows.

### 9) Community
- Present in frontend pages conceptually.
- Missing backend-grade forum/groups/moderation/abuse controls/anonymous mode model.

### 10) Gamification
- Missing points/levels/achievements/progress statistics backend.

### 11) Infrastructure
- Present: basic web frontend + backend API skeleton.
- Missing:
  - clinic/lab/pharmacy/delivery/insurance connectors;
  - mobile API concerns and device auth hardening;
  - full security program (encryption, audit depth, DLP controls).

## II. Doctor features

### 1) Workspace
- Present: doctor dashboard/cases/profile/queue/appointments basics.
- Missing:
  - full CRM + longitudinal EMR tooling;
  - home visit operational routing;
  - advanced calendar/availability system.

### 2) AI assistant for doctor
- Missing majority:
  - protocol suggestions/checklists;
  - contraindication and drug interaction engine;
  - real-time copilot hints + voice-to-EMR.

### 3) Documents & automation
- Missing:
  - recipe/certificate generation pipeline;
  - EDS integration and legal validation checks.

### 4) Income & analytics
- Present: simple earnings endpoint.
- Missing forecast/load optimization/patient funnel analytics.

### 5) Patient loyalty
- Missing automated follow-up plans and therapy adherence alerts.

### 6) Professional growth
- Missing ratings/reviews lifecycle, webinars/learning/certification, case publication/research analytics.

### 7) Collaboration
- Missing doctor-to-doctor chat, consult board, expert referral workflow.

### 8) Integrations
- Missing production integrations with labs/pharmacy/Wolt/insurance and partner API contracts.

## 5) Critical technical and compliance gaps for production backend
- No comprehensive automated test suite (unit/integration/e2e/contract/load/security).
- No migration framework/state management shown for evolving DB schema.
- No robust observability stack (structured logs, metrics, tracing, alerting).
- No explicit PII/data-protection controls (field encryption, key rotation, access reviews).
- No documented medical/legal compliance implementation details for telemedicine and signatures.
- No anti-fraud/risk controls for payments and abuse prevention for community modules.

## 6) Recommended roadmap to reach a “full backend”

### Phase 0 (stability hardening, immediate)
1. Health/readiness checks and API error contract normalization.
2. Complete auth model (refresh tokens, revocation, session tracking, RBAC hardening).
3. Add migrations + seed strategy and environment profiles.
4. Add minimal e2e suite on top critical flows.

### Phase 1 (core clinical loop)
1. EMR domain model (patient profile, visits, labs, prescriptions, documents).
2. Consultation domain (chat/video metadata, revisit, urgent queue).
3. Prescription + signature lifecycle.
4. Payment ledger + subscription model.

### Phase 2 (ecosystem integrations)
1. Pharmacy integration contract + delivery orchestration (Wolt).
2. Labs and insurance connectors.
3. Notification orchestration engine.

### Phase 3 (AI depth + personalization)
1. AI risk and deterioration models with explainability/audit.
2. Personalized assistant with safe memory over EMR.
3. Digital twin and gamification services.

### Phase 4 (compliance + scale)
1. Security/compliance controls and legal workflows.
2. Observability and SRE runbooks.
3. Performance/load testing and capacity planning.

## 7) Definition of “full backend” for this product
Backend is “full” only when the closed loop works in production-grade mode:
**AI triage → doctor consultation → signed prescription/documents → pharmacy dispatch → delivery tracking → adherence monitoring → repeat visit orchestration → analytics + retention loops**,
with legal compliance, security controls and partner integrations in place.
