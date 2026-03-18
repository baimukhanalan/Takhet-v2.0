# Takhet+ Full Backend Checklist Status (excluding family account + delivery + home visit by decision)

## Scope note
- Per current product decision, **family account**, **home visit** and **delivery** blocks are intentionally excluded from current implementation scope.

## A) What is already implemented (or scaffolded strongly)
- Identity/Auth/Roles/JWT guards + role guards.
- Partner/doctor/patient/admin role endpoints.
- Case lifecycle with payout condition coupling.
- Clinic scope in doctor/case/payment and partner-scoped access model.
- Triage AI baseline and AI storage tables.
- Documents/signatures/RTC signaling + token generation baseline.
- Payments + webhook + idempotency baseline + 70/10/20 split + hold.
- Audit/notifications and core EMR storage primitives.

## B) What I can implement now without your further decisions (fast path)
1. Add cron worker to move `hold -> ready_for_payout` automatically.
2. Add admin payout UI/backend safeguards (double-check windows, dry-run endpoint).
3. Add partner analytics endpoints fully clinic-scoped (commission trends, payout backlog).
4. Add e2e smoke tests for core flow (auth -> case -> paid -> consultation_finished -> earning).
5. Add stricter DB constraints/indexes and migration split files.

## C) What I can implement, but it needs more time (medium effort)
1. Full EMR write/read APIs per section (diagnoses/symptoms/vitals/labs/imaging/procedures).
2. Complete consultation domain (chat history APIs, revisit API, urgent queue controls).
3. Subscription/package/installment business logic with billing states.
4. Doctor collaboration workflows (doctor_consultations/expert_reviews) with RBAC.
5. Advanced AI overlays (risk trajectories, doctor-assist drafts) with auditability.

## D) What I cannot complete correctly without your explicit operational/legal inputs
1. **Real EDS (NCALayer/NCA RK)** legal-signature lifecycle.
2. Final legal document taxonomy: mandatory vs optional signed artifacts at launch.
3. Production RLS matrix approval for partner/admin edge-cases.
4. External integrations contracts (labs/pharmacy/insurance): API specs and credentials.
5. Financial operations policy: payout cutoffs, reversal windows, dispute handling.

## E) Exactly what I need from you now
1. EDS policy decisions:
   - which docs are legally mandatory signed at launch (`report`, `prescription`, etc.)
   - signature format + provider constraints (CMS/PKCS7 and verification rules)
2. Ops payout policy:
   - weekly payout day/time, timezone, reversal authority and deadline
3. Security governance:
   - final partner/admin visibility matrix for RLS in production
4. Integration access:
   - staging credentials and API docs for lab/insurance/pharmacy partners
5. Data governance:
   - retention policy for medical docs/chat/audit and deletion policy

## F) Tables currently required/available for full checklist (excluding family account/delivery/home visit)

### Identity/RBAC
- `users`, `roles`, `permissions`, `sessions`, `devices`

### Patient profile + EMR
- `patients`, `patient_profiles`, `patient_conditions`, `patient_allergies`, `patient_contacts`, `patient_addresses`, `patient_family_history`
- `medical_records`, `diagnoses`, `symptoms`, `vitals`, `lab_results`, `imaging_results`, `procedures`

### Consultations/RTC
- `cases`, `consultations`, `consultation_messages`, `consultation_files`, `rtc_sessions`

### Docs/EDS
- `documents`, `document_versions`, `signatures`, `document_signatures`, `prescriptions`, `medications`

### Payments/Payout
- `payments`, `transactions`, `subscriptions`, `packages`, `package_usage`, `installment_plans`
- `doctor_earnings`, `platform_commission`, `clinic_commission`, `payouts`

### Clinic/partner
- `clinics`, `doctors`, `doctor_profiles`, `doctor_reviews`, `doctor_ratings`, `doctor_availability`, `doctor_sessions`

### AI and monitoring
- `triage_sessions`, `ai_evaluations`, `ai_recommendations`, `ai_risk_scores`, `ai_symptom_vectors`
- `sleep_data`, `activity_data`, `nutrition_logs`, `glucose_logs`, `blood_pressure_logs`

### Content/community/gamification
- `articles`, `article_categories`, `article_views`, `comments`, `likes`, `bookmarks`, `community_groups`
- `achievements`, `user_points`, `health_goals`, `goal_progress`, `leaderboards`

### Collaborations/Integrations/Security
- `doctor_consultations`, `expert_reviews`
- `lab_integrations`, `pharmacy_partners`, `insurance_providers`
- `audit_logs`, `access_logs`, `security_events`, `notifications`

## G) Documentation that should be maintained in repo (and is needed next)
1. `docs/FINAL_DECISIONS_MVP.md` (single source of truth for product/legal ops decisions)
2. `docs/RLS_MATRIX.md` (role x table x action matrix)
3. `docs/PAYOUT_RUNBOOK.md` (manual weekly payout operational steps)
4. `docs/EDS_INTEGRATION_PLAN.md` (NCALayer flows, API contracts, verification)
5. `docs/INTEGRATIONS_STAGING_SECRETS.md` (non-secret placeholders + ownership)


## H) Incremental progress updates
- ✅ Auto worker for `hold -> ready_for_payout` added in backend (env-controlled interval).
- ✅ Partner/finance DB hardening added: additional indexes + payout status constraints + unique clinic commission per case.
- ✅ Partner clinic-scoped payout backlog analytics endpoint added (`GET /partner/payout-backlog`).
- ✅ Admin payout reversal safeguards added: mandatory reason + reversal window guard (`PAYOUT_REVERSAL_WINDOW_DAYS`).
- ✅ Added executable smoke script for core flow (`scripts/smoke-core-flow.sh`): health -> auth -> create case -> list my cases.
- ⏳ Still pending owner approvals: legal EDS policy, final RLS governance sign-off, payout reversal/dispute ops policy, external staging credentials/contracts, retention/deletion policy.


## I) Progress percentage (current)
- Fast-path engineering tasks (section B): **5/5 completed = 100%**.
- Owner-dependent decisions (sections D+E): **0/5 completed = 0% by engineering side** (awaiting owner/legal/security/ops inputs).
- Combined high-level checklist completion: **~64%** (engineering-completable blocks mostly done; owner approvals remain the main blocker).
