# Takhet+ Workspace (Frontend + Backend)

Проект разделён на:

- `frontend/` — React/Vite приложение.
- `backend/` — NestJS API (MVP домены: auth, users, triage, cases, doctors, payments, files).

## 1) Быстрый запуск backend

```bash
npm config set registry https://registry.npmjs.org/
npm cache clean --force

cd backend
cp .env.example .env
npm install
npm run start:dev
```

Ожидаемый лог:

```bash
Server started on port 3000
```

## 2) Быстрый запуск frontend

```bash
cd frontend
npm install
npm run dev
```

## 3) Ключевые API (MVP)

- `POST /auth/login`
- `POST /triage` (JWT + rate limit)
- `POST /cases`
- `GET /cases/my`
- `PATCH /cases/:id/respond`
- `PATCH /cases/:id/close`
- `GET /doctor/cases`
- `GET /doctor/case/:id`
- `POST /doctor/case/:id/respond`
- `GET /doctor/profile`
- `PATCH /doctor/profile`
- `GET /doctor/earnings`
- `GET /partner/doctors`
- `POST /partner/doctors`
- `GET /partner/patients`
- `GET /partner/analytics`
- `GET /partner/payments`
- `GET /admin/users`
- `GET /admin/cases`
- `GET /admin/payments`
- `PATCH /admin/doctor/:id/approve`
- `DELETE /admin/user/:id`
- `POST /payments/create-intent` (Kaspi redirect intent)
- `POST /payments/webhook` (Kaspi callback + signature verify)
- `POST /files/upload`
- `GET /users`

## 4) База данных

Полная SQL схема (MVP + расширение до health-tech платформы) находится в:

- `backend/sql/schema.sql`

Запуск: вставить SQL в Supabase SQL Editor и выполнить.

## 5) Что нужно от владельца проекта для production

1. Создать Supabase проект и передать реальные значения:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_JWT_SECRET`
2. Создать и выдать `GEMINI_API_KEY`.
3. Подписать договор с Kaspi Pay и получить:
   - `KASPI_MERCHANT_ID`
   - `KASPI_SECRET_KEY`
   - webhook/callback URL в публичном домене.
4. Настроить публичный HTTPS домен для webhook-ов Kaspi.
5. Для полностью реальной авторизации заполнить:
   - `APP_ADMIN_EMAIL` / `APP_ADMIN_PASSWORD`
   - `APP_DOCTOR_EMAIL` / `APP_DOCTOR_PASSWORD`
   - `APP_PARTNER_EMAIL` / `APP_PARTNER_PASSWORD`
   - `APP_PATIENT_EMAIL` / `APP_PATIENT_PASSWORD`
   - `APP_JWT_SECRET`

Без этих данных backend работает как технический каркас, но не как полнофункциональная production-система.


## Security note

Если вы публиковали `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET` или `GEMINI_API_KEY` в открытом чате/репозитории, считайте их скомпрометированными и обязательно **ротируйте** в провайдерах.
