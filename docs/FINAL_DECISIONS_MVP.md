# FINAL_DECISIONS_MVP (to be approved by owner)

Статус: **pending approval**. Этот документ — единый источник финальных решений для запуска в staging/prod.

## 1) EDS policy (юридически обязательные подписи)

### 1.1 Обязательные документы на запуске
- [ ] `medical_report` (заключение врача)
- [ ] `prescription` (рецепт)
- [ ] `sick_leave` (лист нетрудоспособности, если в scope)
- [ ] `consent` (информированное согласие)
- [ ] Другое: `____________________`

### 1.2 Формат и проверка подписи
- [ ] Provider: NCALayer / НУЦ РК
- [ ] Signature format: CMS/PKCS#7 (`.p7s`) / attached PKCS#7 / XMLDSIG
- [ ] Verification mode: online OCSP / CRL / mixed
- [ ] Trusted cert chain policy: `____________________`
- [ ] Timestamp authority requirement: да / нет

### 1.3 Legal workflow
- [ ] Кто обязан подписывать: врач / пациент / оба
- [ ] На каком этапе: перед выдачей / при завершении кейса / по событию
- [ ] Нужен ли co-sign (врач + организация): да / нет

---

## 2) Payout ops policy

### 2.1 График выплат
- [ ] Частота: weekly
- [ ] День: `____________________`
- [ ] Время: `____________________`
- [ ] Таймзона: `____________________`

### 2.2 Reversal/disputes
- [ ] Reversal window: `____` календарных дней
- [ ] Кто имеет право reversal: admin / finance-admin / owner
- [ ] Основания reversal: fraud / duplicate / chargeback / medical dispute / other
- [ ] Dispute SLA: `____________________`

### 2.3 Финальные статусы payout lifecycle
Подтвердить для production:
- `hold -> ready_for_payout -> paid_out -> reversed`

---

## 3) Production RLS governance

- [ ] Подтверждена итоговая RLS matrix (`docs/RLS_MATRIX.md`)
- [ ] Подтверждены edge-cases:
  - [ ] Partner не видит данные другой клиники
  - [ ] Doctor видит только свои кейсы/пациентов в рамках политики
  - [ ] Admin доступ к PII логируется в audit
  - [ ] Service-role операции ограничены backend-only

---

## 4) External integrations

Для каждого провайдера нужно зафиксировать:
- [ ] staging base URL
- [ ] auth method (API key/OAuth2/mTLS)
- [ ] test credentials
- [ ] callback/webhook contract
- [ ] error code mapping

Провайдеры:
- [ ] Лаборатории
- [ ] Аптеки
- [ ] Страховые
- [ ] Платежные шлюзы (кроме Kaspi, если есть)

---

## 5) Retention/deletion policy

- [ ] Мед. документы: срок хранения `____`
- [ ] Chat/consultation messages: `____`
- [ ] Audit logs: `____`
- [ ] Soft-delete период: `____`
- [ ] Hard-delete процедура и ответственное лицо: `____`
- [ ] Legal hold (заморозка удаления) policy: `____`

---

## Approval

- Product Owner: `____________________`
- Legal/Compliance: `____________________`
- Security: `____________________`
- Finance/Ops: `____________________`
- Date: `____________________`
