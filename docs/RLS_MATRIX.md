# RLS_MATRIX (approved MVP baseline)

Статус: **approved for MVP** on 2026-03-18.

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
| cases | R/W/C* (own) | R/W/C* (assigned only) | R* (own clinic) | R/W/C/D | R/W/C/D |
| payments | R* (own) | R* (own earnings related) | R* (own clinic) | R/W/C/D | R/W/C/D |
| doctor_earnings | - | R* (self) | R* (own clinic aggregate) | R/W/C/D | R/W/C/D |
| clinic_commission | - | - | R* (own clinic) | R/W/C/D | R/W/C/D |
| payouts | - | R* (self if exposed later) | R* (own clinic aggregate if exposed later) | R/W/C/D | R/W/C/D |
| documents | R/W/C* (own) | R/W/C* (assigned cases) | R* (full content, own clinic only) | R/W/C/D | R/W/C/D |
| signatures | R* (own docs) | R/W/C* (own docs/cases) | - | R/W/C/D | R/W/C/D |
| triage_sessions | R/W/C* (own) | R* (assigned if linked) | - | R/W/C/D | R/W/C/D |
| rtc_sessions | R* (participant) | R/W/C* (participant) | - | R/W/C/D | R/W/C/D |
| notifications | R* (own) | R* (own) | R* (own) | R/W/C/D | R/W/C/D |
| audit_logs | - | - | - | R* (restricted views) | R/W/C/D |

## Mandatory production controls

1. Partner scope strictly by `clinic_id` ownership.
2. Doctor scope strictly by assignment relation only.
3. Patient scope strictly by `user_id` ownership.
4. Admin PII access must be audit-logged.
5. Service-role credentials only from backend runtime (never from client).
6. No separate `finance-admin` role in MVP.
7. No threshold-based dual approval in MVP.

## Approved decisions

1. Doctor sees assigned cases only.
2. Partner may access full document content, but only within own clinic scope.
3. Separate finance-admin role is not used in MVP.
4. Two-step approval for reversal is not required in MVP.

## Sign-off

- Product: `Takhet Product Owner`
- Security: `Takhet Security (MVP)`
- Compliance: `Takhet Compliance (MVP)`
- Date: `2026-03-18`
