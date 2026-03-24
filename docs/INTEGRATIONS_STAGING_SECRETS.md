# INTEGRATIONS_STAGING_SECRETS (MVP approved baseline)

> Не храните реальные секреты в git. Этот файл только для структуры владения и MVP scope фиксации.

## Labs
- Included in MVP: no
- Provider name: `N/A`
- Base URL (staging): `N/A`
- Auth type: `N/A`
- Credential owner: `N/A`
- Expiry/rotation: `N/A`

## Pharmacy
- Included in MVP: no (phase 2)
- Provider name: `N/A`
- Base URL (staging): `N/A`
- Auth type: `N/A`
- Credential owner: `N/A`
- Expiry/rotation: `N/A`

## Insurance
- Included in MVP: no
- Provider name: `N/A`
- Base URL (staging): `N/A`
- Auth type: `N/A`
- Credential owner: `N/A`
- Expiry/rotation: `N/A`

## Payment
- Provider name: `Kaspi`
- Additional providers: `No`
- Base URL (staging): `production/provider contract only`
- Auth type: `shared-secret / HMAC`
- Credential owner: `Takhet backend owner`
- Expiry/rotation: `provider-managed`

## Webhooks
- Public callback URL: `to be configured in deployment environment`
- Signature verification method: `HMAC with shared secret (Kaspi)`
- Replay protection strategy: `idempotency via provider_payment_id UNIQUE`

## Contacts
- Product owner: `Takhet Product Owner`
- Security owner: `Takhet backend owner`
- DevOps owner: `Takhet backend owner`
