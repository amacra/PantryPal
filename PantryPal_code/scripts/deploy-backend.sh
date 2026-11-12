#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "${AWS_REGION:-ca-central-1}" != ca-central-1 ]]; then
  echo 'PantryPal must be deployed in ca-central-1' >&2
  exit 1
fi
sam build --template-file infra/template.yaml
sam deploy --guided --region ca-central-1
