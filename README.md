# Takhet+ — Architecture & Project Rules

## 1) Архитектура

### Monorepo layout
- `frontend/` — React + Vite клиентское приложение.
- `backend/` — NestJS API (RBAC, cases, triage, payments, files, RTC, docs).
- `backend/sql/` — SQL schema + seed для Postgres/Supabase.
- `docs/` — governance/ops/legal документы (RLS, payout, EDS, audits).
- `scripts/` — инфраструктурные утилиты репозитория.

### Backend architecture (NestJS)
- Модульная структура по доменам: `auth`, `users`, `cases`, `doctor`, `partner`, `patient`, `payments`, `documents`, `signatures`, `rtc`, `files`, `notifications`, `audit`.
- Доменные сущности через TypeORM entities.
- Контроль доступа: JWT + role guards.
- Интеграционный слой: платежи (Kaspi scaffold), file storage, AI triage wrapper.

### Frontend architecture
- Ролевая навигация и страницы по сценариям (`admin`, `doctor`, `partner`, `patient`).
- API-слой в `frontend/services/`:
  - `api.ts` — базовый HTTP-клиент,
  - `roleApi.ts` — role-oriented API adapter.
- UI-компоненты в `frontend/components/`, маршруто-ориентированные страницы в `frontend/pages/`.

---

## 2) Стилевые правила (code style)

### Общие
- Не добавлять функциональность вне согласованного scope.
- Избегать “магических” значений: выносить конфиг в env/constants.
- Любые критичные операции (платежи, доступ к PII) должны быть audit-friendly.

### Backend
- Следовать модульности NestJS: controller -> service -> entity.
- Ролевые ограничения применять на endpoint-уровне.
- Новые бизнес-правила фиксировать в доменном сервисе, а не в контроллере.

### Frontend
- Не смешивать сетевую логику с UI: API вызовы через `services/*`.
- Страницы должны быть устойчивы к API-ошибкам (graceful fallback/UI state).
- Переиспользовать общие компоненты вместо дублирования JSX.

---

## 3) Главные правила проекта

1. **Scope lock:** вне текущего scope исключены:
   - family account,
   - home visit,
   - delivery.
2. **Security-first:** секреты и service keys не хранятся в репозитории.
3. **RLS/RBAC consistency:** доступ к данным только по утверждённой role/scope модели.
4. **Payout discipline:** payout lifecycle и reversal-действия должны соответствовать утверждённой ops-политике.
5. **Legal discipline (EDS):** юридически значимые документы и подписи внедряются только после финального policy approval.

---

## 4) Важные документы

- `docs/FINAL_DECISIONS_MVP.md`
- `docs/RLS_MATRIX.md`
- `docs/PAYOUT_RUNBOOK.md`
- `docs/EDS_INTEGRATION_PLAN.md`
- `docs/OWNER_REQUIRED_INPUTS.md`
