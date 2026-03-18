# OWNER_REQUIRED_INPUTS (что может закрыть только владелец продукта)

Ниже собраны пункты из checklist, которые невозможно корректно финализировать только кодом.

## 1) Legal / EDS policy (обязательные решения)

1. Утвердить перечень юридически обязательных подписываемых документов на MVP:
   - `medical_report`
   - `prescription`
   - `consent`
   - `sick_leave` (если в scope)
2. Утвердить технический формат подписи:
   - CMS/PKCS#7 (attached/detached) или другой допустимый формат
3. Утвердить verify-политику:
   - OCSP/CRL/mixed
   - доверенная цепочка сертификатов
   - требование timestamp/LTV
4. Утвердить юридический workflow:
   - кто подписывает (врач/пациент/оба)
   - на каком шаге процесса
   - нужна ли countersign подпись организации

## 2) Financial ops / payout policy

1. Подтвердить payout график:
   - день недели
   - время
   - таймзона
2. Подтвердить reversal/dispute policy:
   - окно reversals (кол-во дней)
   - кто имеет полномочия на reversal
   - список оснований reversal
   - dispute SLA и эскалация
3. Подтвердить нужен ли отдельный `finance-admin` и/или second approval для крупных reversals.

## 3) Production RLS governance

1. Утвердить итоговую роль-матрицу доступа (`docs/RLS_MATRIX.md`).
2. Подтвердить edge-cases:
   - doctor видимость (только assigned cases или весь clinic scope)
   - partner доступ к документам (metadata only vs content)
   - admin доступ к PII и обязательный аудит
3. Подписать ответственных (Product/Security/Compliance) и дату ввода в prod.

## 4) External integrations (доступы и контракты)

1. Передать staging credentials и API docs для:
   - labs
   - pharmacy
   - insurance
   - additional payment providers (если есть)
2. Подтвердить webhook contracts:
   - callback URL
   - подпись/verify
   - replay protection

## 5) Data governance

1. Зафиксировать retention policy:
   - medical documents
   - chat/consultation artifacts
   - audit logs
2. Зафиксировать deletion policy:
   - soft-delete window
   - hard-delete процесс и ответственные
   - legal hold исключения

---

## Почему это не закрывается только разработкой

Эти решения меняют юридическую валидность, финансовые риски и compliance-обязательства компании. Они должны быть утверждены владельцем продукта совместно с legal/compliance/security/finance, после чего команда имплементирует их как code/config/runbooks.
