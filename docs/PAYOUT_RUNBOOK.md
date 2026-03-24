# PAYOUT_RUNBOOK (manual weekly operations)

Статус: **approved MVP operations baseline**.

## Confirmed policy

- Weekly payout day: Monday
- Weekly payout time: 12:00
- Timezone: Asia/Almaty
- Reversal window: 7 calendar days
- Reversal authority: admin only
- Dispute SLA: 3 business days
- Escalation chain: admin -> product owner
- Finance-admin role: not used
- Two-step reversal approval: not used in MVP

## Preconditions

1. Все платежи синхронизированы и имеют корректный `status`.
2. Для payout eligible соблюдены условия:
   - payment = `paid`
   - case = `consultation_finished` или `closed`
   - hold period истёк
3. Ответственная роль: admin.

## Weekly flow

1. Dry-run (проверка объёма перед созданием):
   - `POST /admin/payouts/dry-run`
2. Prepare (перевод hold -> ready_for_payout):
   - `POST /admin/payouts/prepare`
3. Просмотр кандидатов:
   - `GET /admin/payouts?status=ready_for_payout`
4. Создание payout батча:
   - `POST /admin/payouts/create`
5. После внешней выплаты отметить как `paid_out`.

## Reversal flow

1. Проверить основание reversal:
   - refund
   - duplicate payment
   - fraud
   - dispute
2. Проверить, что операция в пределах окна 7 дней.
3. Подготовить `reason` (обязательно, min 3 символа).
4. Выполнить:
   - `PATCH /admin/payout/:id/reverse` с body `{ "reason": "..." }`
5. Проверить, что reversal проходит в пределах `PAYOUT_REVERSAL_WINDOW_DAYS`.
6. Убедиться, что audit записал причину и актора.

## Operational controls

- Все ручные действия фиксируются в audit.
- Idempotency обязателен для webhook/payment processing.
- Ошибки внешнего провайдера фиксируются с retry/backoff регламентом.
