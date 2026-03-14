# Takhet+ MVP Execution Status (final payout + clinic scope)

## Выполнено

1. **LiveKit keys подставлены в env-example**
- `LIVEKIT_URL=wss://tahet-mjsltgnt.livekit.cloud`
- `LIVEKIT_API_KEY=APIsEdHJVc24QwT`
- `LIVEKIT_API_SECRET=sheOj02LrDiC0yiTVOS1wbIBfLSq8T6eBCfuya8gqMTB`
- Project/SIP metadata добавлены.

2. **Финальная payout-модель внедрена (70/10/20)**
- doctor = 70%
- clinic_partner = 10%
- platform = 20%

3. **Правило создания earning внедрено**
- earning создаётся только когда:
  - `payment.status = paid`
  - и `case.status IN (consultation_finished, closed)`
- если консультация ещё не завершена, earning откладывается.

4. **Hold period внедрён**
- `hold_until = now() + 7 days`
- стартовый статус earning: `hold`

5. **Clinic scope добавлен**
- добавлена таблица `clinics`
- `doctors.clinic_id`
- `cases.clinic_id`
- `payments.clinic_id`
- добавлена таблица `clinic_commission`

6. **Антифрод baseline усилен**
- `provider_payment_id UNIQUE` (already)
- webhook idempotent (`status=paid` повторно не обрабатывается)
- earning создаётся один раз на case (`ux_doctor_earnings_case`)
- payout duplicate baseline (`ux_payout_doctor_period`)

---

## Что не получилось

1. Полноценная интеграция NCALayer/НУЦ РК всё ещё не закрыта
- нужен отдельный контур подписи PKCS7 и верификации.

2. Автоматический payout-джоб (hold -> ready_for_payout -> paid_out) пока не добавлен
- нужны cron/worker и процессинг выплат.

3. Puppeteer install в окружении блокируется registry policy (403)
- остаётся рабочий runtime fallback PDF engine.

---

## Что ещё требуется от вас

1. Подтвердить clinic-партнёра для каждого врача в staging/prod (маппинг doctors -> clinics).
2. Подтвердить финальный процесс payout (кто запускает, как часто, статус paid_out/reversed).
3. Дать параметры реального ЭЦП провайдера (NCALayer) и тестовый стенд.
4. Подтвердить матрицу RLS для partner (clinic-scoped доступ) на production данных.

---

## Что можно сделать без вашего участия

1. Добавить cron-процесс перевода `hold -> ready_for_payout`.
2. Добавить endpoint batch payout generation.
3. Добавить partner analytics по clinic commission.
4. Добавить e2e тесты на payout и antifraud правила.
