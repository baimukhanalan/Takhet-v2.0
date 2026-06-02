# Security Best Practices Report

## Executive summary

Платформа содержит несколько критичных уязвимостей в аутентификации, управлении секретами и разграничении доступа. Самые серьёзные из них позволяют:

- войти в систему по известным дефолтным данным при ошибке конфигурации;
- получить полный доступ к API-ключу Gemini из клиентского bundle;
- хранить и проверять пароли в открытом виде;
- давать партнёру доступ к глобальным врачам и глобальной аналитике, а не к своему скоупу.

Ниже перечислены findings по приоритету.

## Critical

### SEC-1 Plaintext passwords and direct password comparison

Impact: компрометация БД или логов немедленно раскрывает все пользовательские пароли и позволяет повторно использовать их на других сервисах.

- Evidence:
  - [backend/src/auth/auth.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\auth\auth.service.ts):49
  - [backend/src/auth/auth.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\auth\auth.service.ts):50
  - [backend/src/auth/auth.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\auth\auth.service.ts):65
  - [backend/src/auth/auth.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\auth\auth.service.ts):68
  - [backend/src/auth/auth.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\auth\auth.service.ts):128
  - [backend/src/doctors/doctors.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\doctors\doctors.service.ts):187
- Problem:
  - `user.passwordHash !== password` означает прямое сравнение строки пароля, а не проверку криптографического хеша.
  - регистрация сохраняет пароль как `passwordHash: password`.
  - служебные аккаунты создаются с фиксированными значениями вроде `dev-auth-bypass` и `managed-by-admin`.
- Fix direction:
  - перейти на `argon2id` или `bcrypt` с per-user salt;
  - мигрировать существующие записи при следующем логине или отдельным migration job;
  - убрать любые служебные пароли-заглушки из runtime данных.

### SEC-2 Known default credentials and weak JWT secret fallbacks

Impact: при любой ошибке env-конфигурации приложение поднимется с известными логинами, паролями и слабым JWT secret.

- Evidence:
  - [backend/src/config/env.config.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\config\env.config.ts):18
  - [backend/src/config/env.config.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\config\env.config.ts):19
  - [backend/src/config/env.config.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\config\env.config.ts):20
  - [backend/src/config/env.config.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\config\env.config.ts):26
  - [backend/src/auth/auth.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\auth\auth.service.ts):33
  - [backend/.env.example](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\.env.example):10
  - [backend/.env.example](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\.env.example):11
- Problem:
  - backend имеет fallback на реальные/известные логины и пароли.
  - JWT signing secret имеет fallback `takhet-dev-jwt-secret`.
  - при деплое без строгой валидации env это превращается в прямой auth bypass.
- Fix direction:
  - сделать обязательную валидацию env при старте и падать, если нет production secrets;
  - убрать все credential fallbacks из runtime-конфига;
  - заменить `.env.example` на безопасные placeholder values без реальных адресов и без рабочих шаблонов паролей.

### SEC-3 Gemini API key is exposed to the browser

Impact: любой пользователь браузера может извлечь AI API key из frontend bundle и использовать его вне платформы за ваш счёт.

- Evidence:
  - [frontend/src/services/gemini.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\frontend\src\services\gemini.ts):3
  - [frontend/src/services/gemini.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\frontend\src\services\gemini.ts):4
  - [frontend/src/pages/AdminDashboard.tsx](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\frontend\src\pages\AdminDashboard.tsx):366
  - [frontend/vite.config.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\frontend\vite.config.ts):10
  - [frontend/vite.config.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\frontend\vite.config.ts):11
- Problem:
  - клиент напрямую создаёт `GoogleGenAI` с `VITE_GEMINI_API_KEY`.
  - Vite также инжектит `process.env.GEMINI_API_KEY` в bundle.
  - это не секрет после сборки: ключ становится клиентским.
- Fix direction:
  - полностью вынести Gemini-вызовы на backend proxy endpoints;
  - ключ хранить только на сервере;
  - отозвать текущий ключ после миграции.

## High

### SEC-4 Partner role has global doctor and case visibility/control

Impact: один partner может видеть и менять врачей и кейсовую аналитику всей платформы, а не только своего клинического скоупа.

- Evidence:
  - [backend/src/partner/partner.controller.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\partner\partner.controller.ts):73
  - [backend/src/partner/partner.controller.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\partner\partner.controller.ts):83
  - [backend/src/partner/partner.controller.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\partner\partner.controller.ts):88
  - [backend/src/partner/partner.controller.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\partner\partner.controller.ts):108
  - [backend/src/doctors/doctors.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\doctors\doctors.service.ts):47
  - [backend/src/doctors/doctors.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\doctors\doctors.service.ts):146
  - [backend/src/cases/cases.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\cases\cases.service.ts):112
  - [backend/src/cases/cases.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\cases\cases.service.ts):121
  - [backend/src/cases/cases.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\cases\cases.service.ts):129
- Problem:
  - `partner/doctors` возвращает `listAll()`.
  - partner может активировать/деактивировать врача по произвольному `id`.
  - partner requests/analytics/patients строятся по глобальным кейсам.
- Fix direction:
  - ввести явную tenant/clinic ownership модель;
  - фильтровать doctors/cases/payments по partner-owned clinic ids;
  - запретить activation/deactivation doctor records вне tenant scope.

### SEC-5 Tracked `.env.local` files and incomplete ignore rules

Impact: секреты могут быть случайно закоммичены и уже частично закоммичены в репозиторий.

- Evidence:
  - [.gitignore](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\.gitignore):3
  - [.gitignore](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\.gitignore):4
  - [.gitignore](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\.gitignore):5
  - repo index currently contains:
    - `C:\Users\user\OneDrive\Документы\New project\Takhet-v2.0\.env.local`
    - `C:\Users\user\OneDrive\Документы\New project\Takhet-v2.0\frontend\components\.env.local`
- Problem:
  - `.gitignore` покрывает `.env` и несколько конкретных путей, но не покрывает `.env.local`, `.env.*`, `*.local`.
  - в git уже есть tracked `.env.local` files.
- Fix direction:
  - немедленно расширить ignore patterns: `.env*`, `**/.env*`, `*.local`;
  - удалить секреты из git history там, где это нужно;
  - ротировать все секреты, которые могли находиться в этих файлах.

### SEC-6 Unrestricted file upload with service-role storage access

Impact: авторизованный пользователь может использовать backend как прокси для произвольной записи в storage, включая storage abuse, oversized uploads и небезопасные content types.

- Evidence:
  - [backend/src/files/files.controller.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\files\files.controller.ts):6
  - [backend/src/files/files.controller.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\files\files.controller.ts):13
  - [backend/src/files/files.controller.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\files\files.controller.ts):24
  - [backend/src/files/files.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\files\files.service.ts):10
  - [backend/src/files/files.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\files\files.service.ts):13
  - [backend/src/files/files.service.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\files\files.service.ts):14
- Problem:
  - нет ограничений на размер файла;
  - `mimeType` и `fileName` доверяются клиенту;
  - загрузка идёт через service-role key с практически полными storage правами.
- Fix direction:
  - жёстко ограничить allowlist MIME types и max size;
  - нормализовать имена файлов;
  - по возможности перейти на signed upload URL с ограниченным scope, а не service-role upload proxy.

## Medium

### SEC-7 Open community posting enables spoofing and spam

- Evidence:
  - [backend/src/community/community.controller.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\community\community.controller.ts):46
  - [backend/src/community/community.controller.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\community\community.controller.ts):47
- Problem:
  - создание community posts доступно без auth;
  - поле `author` полностью задаётся клиентом;
  - это открывает impersonation/spam/abuse surface.
- Fix direction:
  - либо требовать auth,
  - либо ввести anti-spam rate limits/captcha/moderation queue и не доверять произвольному `author`.

### SEC-8 Wide-open CORS and token storage in localStorage increase XSS blast radius

- Evidence:
  - [backend/src/main.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\backend\src\main.ts):11
  - [frontend/services/api.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\frontend\services\api.ts):22
  - [frontend/services/api.ts](C:\Users\user\OneDrive\Документы\New%20project\Takhet-v2.0\frontend\services\api.ts):24
- Problem:
  - backend разрешает CORS без origin allowlist;
  - access token хранится в `localStorage`;
  - при любой XSS на origin злоумышленник получает долгоживущий bearer token.
- Fix direction:
  - ограничить CORS только доверенными origins;
  - рассмотреть переход на secure httpOnly cookies или хотя бы сократить lifetime/access scope токена;
  - дополнительно ввести CSP и строгую sanitization strategy.

## Residual risks / hardening gaps

- Нет строгой env schema validation на старте приложения.
- Нет явной CSP/secure headers конфигурации.
- Нет видимых ограничений на account lockout, suspicious login detection и forced credential rotation.
- В AI/medical flows есть прямые calls к внешним LLM-сервисам; с точки зрения privacy/compliance нужно отдельно проверить policy по PII/PHI.

## Recommended remediation order

1. Убрать client-side AI keys и ротировать Gemini key.
2. Убрать все default credentials и слабые secret fallbacks; сделать startup fail-fast.
3. Мигрировать пароли на безопасное hashing + reset credential baseline.
4. Закрыть partner multi-tenant authorization gaps.
5. Ограничить uploads и ротировать storage/service-role secrets при необходимости.
6. Закрыть git secret hygiene (`.env.local`, history cleanup, ignore rules).
