# Takhet+ MVP Execution Status (partner RLS + manual payout flow)

## Confirmed MVP decisions implemented

1. **doctor -> clinic mapping**
- Для MVP зафиксирована модель: один врач принадлежит одной клинике (`doctors.clinic_id`).
- Создание doctor через partner flow привязывает врача к клинике партнёра.

2. **payout process: manual, weekly**
- Добавлен ручной контур выплат через admin endpoints:
  - `POST /admin/payouts/prepare` (hold -> ready_for_payout)
  - `GET /admin/payouts`
  - `POST /admin/payouts/create`
  - `PATCH /admin/payout/:id/reverse`
- Статусы используются как согласовано:
  - `hold -> ready_for_payout -> paid_out -> reversed`
- Ops baseline утверждён:
  - Monday
  - 12:00
  - Asia/Almaty
  - reversal window = 7 days
  - admin only

3. **final payout economics**
- Внедрена формула:
  - doctor = 70%
  - clinic = 10%
  - platform = 20%
- earning создаётся только при:
  - `payment.status = paid`
  - `case.status in (consultation_finished, closed)`
- hold period = 7 дней.

4. **partner clinic-scoped RLS scope**
- Partner доступ ограничен только своей клиникой через `clinics.partner_user_id`.
- Doctor visibility для MVP = assigned only.
- Partner documents scope для MVP = full content, but clinic-scoped only.

5. **EDS scope decision**
- На MVP юридически значимая ЭЦП не требуется.
- На MVP не выпускаются юридически значимые медицинские документы.
- Разрешены рекомендации врача и PDF-артефакты без legal EDS status.

---

## Что не выполнено полностью

1. **Реальный ЭЦП NCALayer/НУЦ РК**
- Сознательно отложен на post-MVP phase.

2. **Puppeteer install policy**
- Установка в окружении блокируется 403, используется fallback PDF engine.

---

## Что ещё требуется от вас

- Для MVP owner-side blocking inputs больше не требуется.
- Для post-MVP потребуются решения по EDS, внешним интеграциям и расширенному compliance scope.

---

## Что можно делать следующим шагом

1. Деплой backend.
2. Подключение Kaspi webhook в окружении.
3. Сквозной runtime smoke / UAT.
4. Подключение frontend к deployed backend.

---

## Incremental update (current)
- Added partner clinic commission analytics endpoint: `GET /partner/commissions`.
- Added admin payout dry-run endpoint: `POST /admin/payouts/dry-run` before actual payout creation.
- Frontend API adapter extended with:
  - `partnerCommissions()`
  - `adminPayoutDryRun(...)`

## Incremental update (readme cleanup + checklist continuation)
- README сокращён до архитектуры, code style и главных проектных правил без operational шума.
- Для merge hygiene сохранена проверка `scripts/verify-merge-clean.sh` перед push/PR.

## Incremental update (auto payout prepare scheduler)
- Added background scheduler in backend payments module to automatically run `hold -> ready_for_payout`.
- Scheduler is controlled by env flags:
  - `PAYOUT_AUTO_PREPARE_ENABLED`
  - `PAYOUT_AUTO_PREPARE_INTERVAL_MS`
- `paid_out` stage remains manual by admin flow as per MVP ops control.

## Incremental update (db hardening for payouts/partner scope)
- Added SQL indexes for payout and partner analytics hot paths (`doctor_earnings`, `payments`, `clinic_commission`, `payouts`).
- Added integrity checks for payout statuses via DB constraints:
  - `chk_doctor_earnings_status`
  - `chk_payouts_status`
- Added unique index `ux_clinic_commission_case` to prevent duplicate clinic commission per case.

## Incremental update (partner payout backlog analytics)
- Added clinic-scoped partner payout backlog endpoint: `GET /partner/payout-backlog`.
- Endpoint returns aggregated backlog by status (`hold`, `ready_for_payout`) and doctor-level breakdown inside partner clinic scope.
- Frontend role API extended with `partnerPayoutBacklog()`.

## Incremental update (payout reversal safeguards)
- Added mandatory reversal reason for admin reverse payout API.
- Added reversal window guard via env: `PAYOUT_REVERSAL_WINDOW_DAYS`.
- Reversal audit now stores `reason` and payout age metadata.

## Incremental update (core smoke script)
- Added executable checklist smoke script: `scripts/smoke-core-flow.sh`.
- Script validates minimal runtime chain: `/health` -> `/auth/login` (patient) -> `POST /cases` -> `GET /cases/my`.

## Incremental update (owner package applied)
- Applied owner-approved MVP baseline:
  - no legal EDS on launch,
  - payouts Monday 12:00 Asia/Almaty,
  - reversal window 7 days,
  - admin-only reversals,
  - doctor scope = assigned only,
  - partner docs = full content within own clinic,
  - Kaspi only, external medical integrations deferred,
  - retention/deletion policy fixed.
