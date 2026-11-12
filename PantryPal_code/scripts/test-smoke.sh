#!/usr/bin/env bash
set -euo pipefail
: "${API_BASE:?Set API_BASE to the deployed API URL}"
curl --fail-with-body --silent --show-error "$API_BASE/health"
# Protected endpoints require a token; this read-only smoke check creates no accounts.
if [[ -n "${SESSION_TOKEN:-}" ]]; then
  curl --fail-with-body --silent --show-error "$API_BASE/suggest" \
    -H "Authorization: Bearer $SESSION_TOKEN" -H 'Content-Type: application/json' \
    -d '{"ingredients":["rice","tomato"]}'
fi
