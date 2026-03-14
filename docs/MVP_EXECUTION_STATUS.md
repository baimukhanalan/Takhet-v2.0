# Takhet+ MVP Execution Status (updated with your checklist)

## Что выполнено сейчас

1. **LiveKit config внесён в проект**
- В `.env.example` добавлены:
  - `LIVEKIT_URL=wss://tahet-mjsltgnt.livekit.cloud`
  - `LIVEKIT_API_KEY=APIsEdHJVc24QwT`
  - `LIVEKIT_PROJECT_ID=p_28qk0bhcpr2`
  - `LIVEKIT_SIP_URI=sip:28qk0bhcpr2.sip.livekit.cloud`
- Добавлен `POST /rtc/token` (и также `POST /rtc/session/token`) для выдачи LiveKit-compatible токена.

2. **PDF generation усилен**
- Реальная генерация PDF в `backend/storage/...`.
- Если Puppeteer доступен, используется он.
- Если Puppeteer недоступен, работает встроенный PDF fallback (чтобы контур не ломался).

3. **RLS + policies добавлены в SQL**
- Включение RLS для таблиц (users/patients/doctors/cases/consultations/medical_records/documents/payments/notifications).
- Добавлены policy-блоки `users_self`, `patient_records`, `patient_cases`, `doctor_cases`, `document_access`.
- Добавлены storage buckets/policies для `medical-files`, `documents-draft`, `documents-signed`.

4. **PII encryption (AES-256) добавлен в backend**
- Добавлен `PiiCryptoService` (AES-256-CBC на backend).
- Добавлены endpoints пациента:
  - `POST /patient/pii` (сохранение phone/insurance/policy_number в зашифрованном виде)
  - `GET /patient/pii` (чтение и дешифровка)

5. **Ledger baseline сохранён**
- Комиссия 30/70: `platform_commission` / `doctor_earnings` при `payment=paid`.

6. **Observability env readiness**
- Добавлен `SENTRY_DSN` в env config/example.

---

## Что не получилось (конкретно)

1. **LIVEKIT_API_SECRET отсутствует во входных данных**
- Ключ API есть, но секрет не предоставлен.
- Токен endpoint работает только как контракт до подстановки секрета.

2. **Установка Puppeteer в этом окружении заблокирована**
- `npm install` получает `403 Forbidden` по policy registry.
- Поэтому оставлен runtime fallback PDF-движок, и динамический import Puppeteer.

3. **NCALayer / НУЦ РК не интегрирован физически**
- Нет SDK/драйвера/доступа к рабочему контуру в этом окружении.
- Нужны входные данные провайдера и тестовый стенд подписи.

4. **RLS/storage SQL не применяются автоматически в вашем Supabase**
- SQL подготовлен в `schema.sql`, но фактически должен быть выполнен в SQL Editor/migrations вашей среды.

---

## Что требуется от вас конкретно

1. `LIVEKIT_API_SECRET` (обязательно).
2. Решение по ЭЦП провайдеру: NCALayer/НУЦ РК + формат CMS/PKCS7.
3. Доступ к staging Supabase для применения RLS/storage policies.
4. Подтверждение финальной RLS матрицы ролей (patient/doctor/partner/admin).
5. Подтверждение production payout-правил (кроме 30/70 split).

---

## Что можно сделать без вашего участия для прод-видео

1. Доделать полноценный `LiveKitAdapterModule`:
   - retries, token TTL policies, room naming, join rules.
2. Добавить guardrails:
   - таймауты сессии,
   - participant authorization,
   - авто-завершение и cleanup.
3. Добавить RTC метрики и алерты:
   - started/failed/ended,
   - ICE/offer/answer error buckets.
4. Добавить e2e smoke tests только для signaling/token API.
5. Добавить idempotency keys для критических rtc endpoints.
