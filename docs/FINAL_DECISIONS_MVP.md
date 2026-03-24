# FINAL_DECISIONS_MVP

Статус: **approved for MVP**. Этот документ — единый источник финальных решений для запуска MVP по состоянию на 2026-03-18.

## 1) EDS policy

### 1.1 Решение для MVP
- На MVP **юридически значимая ЭЦП НЕ требуется**.
- На MVP **не выпускаются юридически значимые медицинские документы**.
- Разрешены только:
  - консультации,
  - рекомендации врача,
  - PDF-артефакты без юридического EDS-статуса.

### 1.2 Deferred scope (phase 2+)
EDS позже может быть добавлен для:
- `prescription`
- `official_certificate`

### 1.3 Future EDS baseline (when enabled later)
- Signature format: PKCS#7 (CMS)
- Verify mode: basic verification
- Trust chain: default NCA RK chain
- Timestamp/LTV: not required at MVP stage
- Signer: doctor only
- Signing stage: after consultation
- Co-sign organization: no
- NCALayer/NCA RK acceptance criteria: not required for MVP

---

## 2) Payout ops policy

### 2.1 Schedule
- Frequency: weekly
- Day: Monday
- Time: 12:00
- Timezone: Asia/Almaty

### 2.2 Reversal / disputes
- Reversal window: 7 calendar days
- Reversal authority: admin only
- Reversal grounds:
  - refund
  - duplicate payment
  - fraud
  - dispute
- Dispute SLA: 3 business days
- Escalation chain: admin -> product owner
- Finance-admin role: not required
- 2-step approval: not required

### 2.3 Confirmed payout lifecycle
- `hold -> ready_for_payout -> paid_out -> reversed`

---

## 3) Production RLS governance

- Doctor scope: assigned cases only
- Partner document scope: full content, but only within own clinic scope
- Finance-admin role: no
- Threshold dual approval for reversals: no
- Partner must never access another clinic's data
- Admin PII access must remain audit-logged
- Service-role access remains backend-only

---

## 4) External integrations

### Included in MVP
- Kaspi only
- Webhook contract: HTTPS POST callback
- Webhook statuses: `paid` / `failed`
- Processing: idempotent
- Signature verification: HMAC with shared secret (Kaspi)
- Replay protection: idempotency through `provider_payment_id` uniqueness

### Not included in MVP
- labs
- pharmacy
- insurance
- additional payment providers

Ownership:
- DevOps owner: Takhet backend owner
- Security owner: Takhet backend owner

---

## 5) Data governance

- Medical docs retention: 10 years
- Chat retention: 3 years
- Audit retention: 5 years
- Soft-delete window: 30 days
- Hard-delete: manual admin deletion only
- Responsible approver: admin
- Legal hold: enabled for disputes and compliance cases

---

## Approval

- Product Owner: `Takhet Product Owner`
- Legal/Compliance: `Takhet Compliance (MVP)`
- Security: `Takhet Security (MVP)`
- Finance/Ops: `Takhet Product Owner`
- Date: `2026-03-18`
