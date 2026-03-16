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
- Добавлены политики для partner-клиники на уровне SQL для:
  - `doctors`
  - `cases`
  - `payments`
  - `clinic_commission`
- Partner доступ ограничен только своей клиникой через `clinics.partner_user_id`.

---

## Что не выполнено полностью

1. **Реальный ЭЦП NCALayer/НУЦ РК**
- Пока остаётся интеграционный пробел (PKCS7/verify flow).

2. **Автоматический payout scheduler**
- Сейчас процесс ручной (что и требуется для MVP),
- auto-cron не внедрялся в этом шаге.

3. **Puppeteer install policy**
- Установка в окружении блокируется 403, используется fallback PDF engine.

---

## Что ещё требуется от вас

1. Подтвердить операционно, что payouts реально запускаются admin раз в неделю.
2. Подтвердить rollout RLS-политик в staging/prod Supabase.
3. Подтвердить минимальный пакет документов, обязательных для ЭЦП на старте (report/prescription).
4. Предоставить контур интеграции НУЦ РК/NCALayer (доступы/среда/регламент).

---

## Что можно сделать без вашего участия (следующий шаг)

1. Добавить cron job перевода `hold -> ready_for_payout` по расписанию, оставив `paid_out` ручным.
2. Добавить clinic-scoped partner analytics endpoints по комиссиям и выплатам.
3. Добавить e2e тесты на payout antifraud правила и partner scope access.


## Incremental update (current)
- Added partner clinic commission analytics endpoint: `GET /partner/commissions`.
- Added admin payout dry-run endpoint: `POST /admin/payouts/dry-run` before actual payout creation.
- Frontend API adapter extended with:
  - `partnerCommissions()`
  - `adminPayoutDryRun(...)`
