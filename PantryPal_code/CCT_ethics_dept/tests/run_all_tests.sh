#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
for test_file in test_*_spec.js; do
  node "$test_file"
done
# Handler tests exercise production logic using an injected DynamoDB adapter.
(cd ../../lambda_functions/suggest-function && npm test)
