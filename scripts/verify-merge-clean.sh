#!/usr/bin/env bash
set -euo pipefail

# 1) Check index for unresolved conflicts
if git diff --name-only --diff-filter=U | grep -q .; then
  echo "❌ Unresolved merge entries in git index:" >&2
  git diff --name-only --diff-filter=U >&2
  exit 1
fi

# 2) Check working tree for conflict markers
if rg -n "^(<<<<<<<|=======|>>>>>>>)" . \
  -g '!frontend/node_modules/**' \
  -g '!.git/**' \
  -g '!frontend/dist/**' \
  -g '!backend/dist/**'; then
  echo "❌ Conflict markers found in files." >&2
  exit 1
fi

echo "✅ Merge state is clean: no unresolved conflicts or markers."
