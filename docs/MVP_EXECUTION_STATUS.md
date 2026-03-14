# Takhet+ MVP Execution Status (updated)

## Что выполнено по вашим указаниям

1. **PDF generator**
- Внедрён `PdfService` в модуле документов.
- Логика: сначала пытается использовать Puppeteer (`import('puppeteer')` динамически), если пакет/браузер недоступен — генерирует валидный PDF встроенным fallback-движком.
- `documents.render-pdf` теперь реально создаёт файл в `backend/storage/...`.

2. **WebRTC инфраструктура (production-ready direction)**
- Signaling endpoints сохранены.
- Добавлен `RtcProviderService` и endpoint `POST /rtc/session/token` для LiveKit-compatible токенов.
- Это позволяет перейти к managed RTC без переписывания доменной логики.

3. **RLS и storage policies (baseline)**
- Добавлены SQL-блоки для `enable row level security` и минимальных policy для:
  - `cases`
  - `documents`
  - `document_versions`
  - `rtc_sessions`
  - `payments`
  - `notifications`
- Добавлены bucket/policy SQL для Supabase storage:
  - `medical-files`
  - `documents-draft`
  - `documents-signed`

4. **Ledger расчёты**
- В `payments.handleWebhook` при `paid` добавлен расчёт:
  - platform commission 30%
  - doctor earnings 70%
- Добавлены insert в `platform_commission` и `doctor_earnings`.

5. **Audit logging расширен**
- Документы: `document.created`, `document.updated`, `document.rendered`, `document.ready_for_sign`, `document.signed`, `document.viewed`, `document.downloaded`, `document.archived`.
- RTC/consultation: `consultation.scheduled`, `consultation.started`, `consultation.ended`, а также `rtc.offer/answer/ice`.

6. **Seed расширен для всех ролей и связанного MVP-контура**
- Пользователи: admin/doctor/partner/patient.
- Доктор/пациент сущности.
- Seed кейсов, платежей, документов, версии документа, подписи, rtc_session, earnings/commission, notifications.

---

## Что конкретно не получилось (ограничения)

1. **Не удалось установить `puppeteer` через npm в этом окружении**
- Установка падает с `403 Forbidden` в npm registry policy.
- Поэтому реализован production-safe fallback:
  - dynamic import Puppeteer (если в окружении доступен — будет использоваться);
  - иначе встроенный PDF writer, который формирует PDF-файл без внешней зависимости.

2. **RLS policy для storage.objects требуют выполнения в Supabase Postgres**
- SQL добавлен, но фактическая активация зависит от выполнения миграции в вашей Supabase среде.

3. **LiveKit/coturn физически не подняты в этом инкременте**
- Добавлена backend-абстракция/token API.
- Нужна отдельная инфраструктурная поставка (managed LiveKit или coturn deployment).

---

## Что требуется от вас конкретно

1. **RTC provider choice (обязательно)**
- Подтвердить: `LiveKit` (рекомендуется) или self-host `coturn + SFU`.
- Если LiveKit: дать `API key`, `API secret`, `ws/wss URL`.

2. **ЭЦП провайдер (обязательно для юридической силы)**
- Подтвердить интеграцию с `NCALayer/НУЦ РК`.
- Утвердить формат подписи (`CMS/PKCS7`) и процесс проверки.

3. **RLS rollout approval**
- Подтвердить финальную policy matrix (patient/doctor/admin/partner доступ к строкам).
- Разрешить применение SQL миграций в staging/prod.

4. **Финансы**
- Подтвердить формулу комиссии (сейчас 30/70, закодирована как baseline).
- Утвердить payout rules (периодичность, статусы, hold/review).

5. **PII encryption scope**
- Утвердить какие поля точно шифруем (phone/passport/insurance и др.), и требования к key management.

---

## Что можно сделать без вашего участия для прод-видео (я могу сделать сразу)

1. Подготовить полноценный **LiveKit adapter module** (provider abstraction + health + retries + room policy), оставив только env-подключение.
2. Добавить backend **session guardrails**:
   - participant authorization
   - session timeout
   - forced end cleanup
3. Добавить **RTC observability hooks**:
   - session started/failed/ended metrics
   - error buckets по ICE/offer/answer
4. Добавить **e2e smoke tests** для signaling API (без реального media-plane).
5. Добавить **idempotency** для критических RTC endpoint-операций.

---

## Следующий технический приоритет (безотлагательно)
1. Применить SQL миграции в staging.
2. Поднять RTC provider (LiveKit).
3. Подключить реальный EDS provider.
4. Включить monitoring stack (Sentry + Prometheus + Grafana).
