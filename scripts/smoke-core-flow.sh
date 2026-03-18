#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
PATIENT_EMAIL="${APP_PATIENT_EMAIL:-patient@takhet.local}"
PATIENT_PASSWORD="${APP_PATIENT_PASSWORD:-patient_password}"

req() {
  local method="$1" path="$2" data="${3:-}" token="${4:-}"
  if [[ -n "$data" ]]; then
    if [[ -n "$token" ]]; then
      curl -sS -X "$method" "$BASE_URL$path" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "$data"
    else
      curl -sS -X "$method" "$BASE_URL$path" -H "Content-Type: application/json" -d "$data"
    fi
  else
    if [[ -n "$token" ]]; then
      curl -sS -X "$method" "$BASE_URL$path" -H "Authorization: Bearer $token"
    else
      curl -sS -X "$method" "$BASE_URL$path"
    fi
  fi
}

echo "[1/4] Health check: $BASE_URL/health"
health="$(req GET /health)"
python - <<'PY' "$health"
import json,sys
obj=json.loads(sys.argv[1])
assert obj.get('status') == 'ok', f"unexpected health payload: {obj}"
print('health=ok')
PY

echo "[2/4] Patient login"
login_payload="$(printf '{"email":"%s","password":"%s","role":"patient"}' "$PATIENT_EMAIL" "$PATIENT_PASSWORD")"
login_resp="$(req POST /auth/login "$login_payload")"
PATIENT_TOKEN="$(python - <<'PY' "$login_resp"
import json,sys
obj=json.loads(sys.argv[1])
t=obj.get('accessToken') or obj.get('token')
assert t, f"token missing: {obj}"
print(t)
PY
)"

echo "[3/4] Create case"
case_resp="$(req POST /cases '{"summary":"Smoke test case summary for checklist flow"}' "$PATIENT_TOKEN")"
CASE_ID="$(python - <<'PY' "$case_resp"
import json,sys
obj=json.loads(sys.argv[1])
case_id=obj.get('id')
assert case_id, f"case id missing: {obj}"
print(case_id)
PY
)"

echo "[4/4] List my cases"
my_cases="$(req GET /cases/my '' "$PATIENT_TOKEN")"
python - <<'PY' "$my_cases" "$CASE_ID"
import json,sys
items=json.loads(sys.argv[1])
case_id=sys.argv[2]
assert isinstance(items,list), f"expected list, got: {items}"
assert any(i.get('id')==case_id for i in items), f"new case {case_id} not found in /cases/my"
print('cases=my contains new case')
PY

echo "✅ Smoke core flow passed"
