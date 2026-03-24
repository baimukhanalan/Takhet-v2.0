# OWNER_REQUIRED_INPUTS

Статус: **resolved for MVP baseline on 2026-03-18**.

Ниже зафиксированы owner-side решения, которые были необходимы для завершения MVP checklist и теперь утверждены.

## 1) Legal / EDS policy
- На MVP юридически значимая ЭЦП не требуется.
- На MVP юридически значимые медицинские документы не выпускаются.
- Future phase baseline:
  - PKCS#7 (CMS)
  - doctor only
  - post-consultation signing
  - no co-sign
  - no strict LTV for MVP phase

## 2) Financial ops / payout policy
- Weekly payout: Monday, 12:00, Asia/Almaty
- Reversal window: 7 days
- Reversal authority: admin only
- Reversal grounds:
  - refund
  - duplicate payment
  - fraud
  - dispute
- Dispute SLA: 3 business days
- Escalation: admin -> product owner
- No finance-admin role in MVP
- No dual approval in MVP

## 3) Production RLS governance
- Doctor scope: assigned only
- Partner documents scope: full content, clinic-scoped only
- Admin PII access remains audit-logged
- Service-role remains backend-only

## 4) External integrations
- MVP integrations:
  - Kaspi only
- Not in MVP:
  - labs
  - pharmacy
  - insurance
  - additional payment providers
- Webhook baseline:
  - HTTPS POST
  - `paid` / `failed`
  - HMAC verification
  - idempotent processing

## 5) Data governance
- Medical documents retention: 10 years
- Chat retention: 3 years
- Audit retention: 5 years
- Soft-delete window: 30 days
- Hard-delete: manual admin deletion only
- Responsible approver: admin
- Legal hold: enabled for disputes and compliance cases

## Outcome
Эти решения сняли owner-side блокеры для MVP completion. Post-MVP scope остаётся возможным отдельным этапом.
