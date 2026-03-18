# RLS_MATRIX (draft for production approval)

Статус: **draft**. Ниже матрица доступа для финального согласования.

## Legend
- `R` = read
- `W` = write/update
- `C` = create
- `D` = delete
- `*` = только в рамках clinic/user scope

## Core access matrix

| Domain/Table | patient | doctor | partner | admin | service-role |
|---|---:|---:|---:|---:|---:|
| users | R* (self) | R* (self) | R* (self) | R/W/C/D | R/W/C/D |
| doctors | R | R* (self) | R/W/C* (own clinic) | R/W/C/D | R/W/C/D |
| clinics | R* (own) | R* (linked) | R/W* (own) | R/W/C/D | R/W/C/D |
| cases | R/W/C* (own) | R/W/C* (assigned) | R* (own clinic) | R/W/C/D | R/W/C/D |
| payments | R* (own) | R* (own earnings related) | R* (own clinic) | R/W/C/D | R/W/C/D |
| doctor_earnings | - | R* (self) | R* (own clinic aggregate) | R/W/C/D | R/W/C/D |
| clinic_commission | - | - | R* (own clinic) | R/W/C/D | R/W/C/D |
| payouts | - | R* (self if exposed) | R* (own clinic aggregate if exposed) | R/W/C/D | R/W/C/D |
| documents | R/W/C* (own) | R/W/C* (assigned cases) | R* (clinic-scoped metadata only) | R/W/C/D | R/W/C/D |
| signatures | R* (own docs) | R/W/C* (own docs/cases) | R* (clinic-scoped metadata only) | R/W/C/D | R/W/C/D |
| triage_sessions | R/W/C* (own) | R* (assigned if linked) | - | R/W/C/D | R/W/C/D |
| rtc_sessions | R* (participant) | R/W/C* (participant) | - | R/W/C/D | R/W/C/D |
| notifications | R* (own) | R* (own) | R* (own) | R/W/C/D | R/W/C/D |
| audit_logs | - | - | - | R* (restricted views) | R/W/C/D |

## Mandatory production controls

1. Partner scope strictly by `clinic_id` ownership.
2. Doctor scope strictly by assignment relation (case/clinic policy as approved).
3. Patient scope strictly by `user_id` ownership.
4. Admin PII access must be audit-logged.
5. Service-role credentials only from backend runtime (never from client).

## Open decisions to approve

1. Должен ли doctor видеть все кейсы клиники или только assigned?
2. Должен ли partner видеть document content или только metadata?
3. Нужен ли отдельный finance-admin role для payouts/reversals?
4. Нужна ли двухэтапная admin approval для reversal > threshold?

## Sign-off

- Product: `____`
- Security: `____`
- Compliance: `____`
- Date: `____`
