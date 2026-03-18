# EDS_INTEGRATION_PLAN (NCALayer / NCA RK)

Статус: **integration plan draft**.

## Goal

Обеспечить юридически валидное подписание медицинских документов через НУЦ РК/NCALayer с проверкой подписи и цепочки доверия.

## Target flow (high-level)

1. Backend формирует canonical document hash + payload.
2. Client инициирует подпись через NCALayer.
3. Client возвращает signature blob (PKCS#7/CMS) в backend.
4. Backend выполняет verify:
   - целостность payload/hash
   - валидность сертификата
   - revocation check (OCSP/CRL)
   - timestamp policy (если обязательна)
5. Backend сохраняет signature metadata + artifact linkage.

## Required decisions

1. Обязательные для ЭЦП типы документов на MVP.
2. Формат подписи (detached/attached CMS, XML).
3. Offline/online verify mode и fallback.
4. Нужна ли countersign организации/клиники.
5. Требования к long-term validation (LTV).

## Data model impact (already scaffolded)

- `documents`
- `document_versions`
- `signatures`
- `document_signatures`

## Security requirements

- Хранить только необходимые signature артефакты.
- Логировать verify result в audit (without secret material).
- Запретить клиентам прямой доступ к service credentials.

## External dependencies needed from owner

- Доступ к staging NCALayer/NCA RK окружению
- API/spec документация verify endpoints
- Сертификаты/chain требования
- Юридические acceptance criteria
