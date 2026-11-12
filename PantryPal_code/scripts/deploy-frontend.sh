#!/usr/bin/env bash
set -euo pipefail
: "${FRONTEND_BUCKET:?Set FRONTEND_BUCKET}"
: "${REACT_APP_API_BASE_URL:?Set REACT_APP_API_BASE_URL}"
cd "$(dirname "$0")/../frontend"
npm ci
npm run build
aws s3 sync build/ "s3://$FRONTEND_BUCKET" --delete --region ca-central-1
