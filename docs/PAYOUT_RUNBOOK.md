# PAYOUT_RUNBOOK (manual weekly operations)

Статус: **operational draft**.

## Preconditions

1. Все платежи синхронизированы и имеют корректный `status`.
2. Для payout eligible соблюдены условия:
   - payment = `paid`
   - case = `consultation_finished` или `closed`
   - hold period истёк
3. Ответственные роли на смене: admin/finance-admin.

## Weekly flow

1. Dry-run (проверка объёма перед созданием):
   - `POST /admin/payouts/dry-run`
2. Prepare (перевод hold -> ready_for_payout):
   - `POST /admin/payouts/prepare`
3. Просмотр кандидатов:
   - `GET /admin/payouts?status=ready_for_payout`
4. Создание payout батча:
   - `POST /admin/payouts/create`
5. После внешней выплаты отметить как `paid_out` (по текущей реализации через admin flow).

## Reversal flow

1. Проверить основание reversal (fraud/duplicate/dispute/chargeback).
2. Проверить, что операция в пределах policy window.
3. Подготовить `reason` (обязательно, min 3 символа).
4. Выполнить:
   - `PATCH /admin/payout/:id/reverse` с body `{ "reason": "..." }`
5. Проверить, что reversal в пределах `PAYOUT_REVERSAL_WINDOW_DAYS`.
6. Создать запись в audit с причиной и актором.

## Operational controls

- Все ручные действия выполняются по чек-листу и фиксируются в audit.
- Любой reversal выше порога требует second approval (если policy включит).
- Ошибки внешнего провайдера фиксируются с retry/backoff регламентом.

## Required policy inputs (owner)

- payout day/time/timezone
- reversal window (days)
- reversal authority role(s)
- dispute SLA and escalation chain
