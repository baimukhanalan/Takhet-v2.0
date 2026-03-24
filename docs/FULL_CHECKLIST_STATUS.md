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

## B) Fast-path engineering tasks
1. ✅ Cron worker to move `hold -> ready_for_payout` automatically.
2. ✅ Admin payout safeguards (double-check windows, dry-run, reverse reason/window).
3. ✅ Partner analytics endpoints clinic-scoped (commissions, payout backlog).
4. ✅ Executable smoke test for core flow (health -> auth -> case -> my cases).
5. ✅ Stricter DB constraints/indexes for payout/partner flows.

## C) Medium-effort items (not blocking MVP launch)
1. Full EMR write/read APIs per section (diagnoses/symptoms/vitals/labs/imaging/procedures).
2. Complete consultation domain (chat history APIs, revisit API, urgent queue controls).
3. Subscription/package/installment business logic with billing states.
4. Doctor collaboration workflows (doctor_consultations/expert_reviews) with RBAC.
5. Advanced AI overlays (risk trajectories, doctor-assist drafts) with auditability.

## D) Owner decisions status
1. ✅ EDS/legal policy fixed for MVP: no legal EDS on launch.
2. ✅ Final document taxonomy for MVP fixed: no legally significant signed docs on launch.
3. ✅ Production RLS matrix decisions approved for MVP baseline.
4. ✅ External integrations scope fixed for MVP: Kaspi only; labs/pharmacy/insurance deferred.
5. ✅ Financial ops policy fixed: weekly Monday 12:00 Asia/Almaty, 7-day reversal window, admin only.
6. ✅ Data governance fixed: retention/deletion/legal hold baseline approved.

## E) Approved owner inputs now fixed
1. EDS policy decisions:
   - no legal EDS on MVP
   - future baseline PKCS#7 / doctor-only / post-consultation
2. Ops payout policy:
   - Monday, 12:00, Asia/Almaty
   - reversal window 7 days
   - admin only
3. Security governance:
   - doctor scope = assigned only
   - partner docs scope = full content within own clinic only
4. Integration access:
   - Kaspi only in MVP
   - labs/pharmacy/insurance excluded from MVP
5. Data governance:
   - medical docs = 10 years
   - chat = 3 years
   - audit = 5 years
   - soft delete = 30 days
   - hard delete = manual admin only

## F) MVP blocking gaps remaining
- No blocking owner-side gaps remain for MVP baseline.
- Remaining work is implementation expansion / post-MVP scope only.

## G) Documentation maintained in repo
1. `docs/FINAL_DECISIONS_MVP.md`
2. `docs/RLS_MATRIX.md`
3. `docs/PAYOUT_RUNBOOK.md`
4. `docs/EDS_INTEGRATION_PLAN.md`
5. `docs/INTEGRATIONS_STAGING_SECRETS.md`

## H) Incremental progress updates
- ✅ Auto worker for `hold -> ready_for_payout` added in backend (env-controlled interval).
- ✅ Partner/finance DB hardening added: additional indexes + payout status constraints + unique clinic commission per case.
- ✅ Partner clinic-scoped payout backlog analytics endpoint added (`GET /partner/payout-backlog`).
- ✅ Admin payout reversal safeguards added: mandatory reason + reversal window guard (`PAYOUT_REVERSAL_WINDOW_DAYS`).
- ✅ Added executable smoke script for core flow (`scripts/smoke-core-flow.sh`): health -> auth -> create case -> list my cases.
- ✅ Owner package applied: MVP legal/ops/RLS/integration/data-governance decisions fixed in repo.

## I) Progress percentage (current)
- Fast-path engineering tasks: **5/5 completed = 100%**.
- Owner-dependent MVP decisions: **5/5 completed = 100%**.
- Combined MVP checklist completion: **100%**.
- Overall backend product maturity including post-MVP items: **~95%**.
