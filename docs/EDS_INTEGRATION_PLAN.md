# EDS_INTEGRATION_PLAN (NCALayer / NCA RK)

Статус: **deferred for post-MVP**.

## MVP decision

На MVP:
- юридически значимая ЭЦП не внедряется,
- NCALayer / NCA RK integration не требуется,
- юридически значимые медицинские документы не выпускаются.

Разрешены только:
- консультации,
- рекомендации врача,
- PDF-артефакты без юридического EDS-статуса.

## Future target flow (phase 2+)

1. Backend формирует canonical document hash + payload.
2. Client инициирует подпись через NCALayer.
3. Client возвращает signature blob (PKCS#7/CMS) в backend.
4. Backend выполняет verify:
   - целостность payload/hash
   - валидность сертификата
   - basic verification against default NCA RK chain
5. Backend сохраняет signature metadata + artifact linkage.

## Future baseline decisions already fixed

- Signature format: PKCS#7 (CMS)
- Verify mode: basic verification
- Trust chain: default NCA RK chain
- Timestamp/LTV: not required for MVP stage
- Signer: doctor only
- Signing stage: after consultation
- Co-sign organization: no

## Data model impact (already scaffolded)

- `documents`
- `document_versions`
- `signatures`
- `document_signatures`

## What remains external when phase 2 starts

- staging access to NCALayer / NCA RK
- provider verify API docs
- certificate chain requirements
- formal legal acceptance criteria
