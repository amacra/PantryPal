# Implemented API and deployment

The application follows ADR 002: React → API Gateway → a Node.js Lambda → DynamoDB, with Spoonacular as the recipe provider. Redis, personalized ranking, allergen filtering, and recipe caching are not implemented. Ingredient quantities are UI-only. The older specifications, root retrospective, mock CCT tests, and bundled ZIP are historical artifacts; deploy current source using SAM rather than the ZIP.

## Endpoints

- `GET /health`: returns `{ "status": "ok" }`.
- `POST /signup`: accepts `email`, `password` (8–128 characters), and `consent: true`; returns 201 with `UserID`, `sessionToken`, and `expiresIn` (3600 seconds). Duplicate emails return 409.
- `POST /login`: accepts email and password and returns the same session fields (200). Invalid credentials return 401.
- `POST /suggest`: requires `Authorization: Bearer <sessionToken>` and 1–50 ingredient names in `ingredients`. Returns up to three recipes, including attribution, images, recipe URLs, and used/missing ingredients. Comma-separated ingredients are also accepted.
- `POST /delete_account`: requires a session and `confirmDelete: true`. Removes all history, then the account. An optional body identity must match the token subject. Returns 200 after erasure. Repeating after successful erasure returns 401 because the session has been revoked; a partially completed deletion may be retried with the original token.

Errors use `{ "error": "..." }`. Sessions use HS256 with fixed issuer/audience and expire after one hour. Account salt binds tokens to an account incarnation, preventing old sessions from accessing a newly registered account at the same email. Account authentication uses consistent DynamoDB reads. Passwords use PBKDF2-SHA256 (100,000 iterations), matching the project's established hash format.

Users store `UserID` (normalized email), `passwordHash`, `salt`, and `createdAt`. During deletion, a temporary `deleting` flag blocks new logins and history writes. History uses `UserID`, `timestamp` (epoch milliseconds), `ingredients`, `recipesPreview`, and `expiresAt` (epoch **seconds**, 30 days after creation). DynamoDB TTL deletes asynchronously; it is not a strict per-user item cap. A transaction checks account state before writing history, preventing in-flight suggestions from recreating data after deletion starts. History deletion paginates, batches at most 25 writes, and retries unprocessed items with bounded backoff. A failed deletion leaves the account locked for retry.

Upstream calls have a four-second timeout, reject redirects, and use a fixed Spoonacular host. Three consecutive failures open a process-local circuit for 30 seconds; after cooldown a single probe is allowed. Failures return an empty recipe list with `stale: true` and a reason, not cached recipes. Set `CALL_EXTERNAL_API=false` to bypass calls. Circuit state is per warm Lambda instance, not global. API throttling and reserved Lambda concurrency provide deployment-level backpressure. Logs contain operational event names and request IDs, not request bodies, credentials, or API keys. History persistence failures do not discard otherwise usable recipe results.

## Local checks

Use Node.js 20 or later (Node.js 22 for Lambda):

```sh
cd lambda_functions/suggest-function
npm ci
npm test
cd ../../frontend
npm ci
CI=true npm test -- --watchAll=false
npm run build
```

Handler tests use the actual application with injected storage and fetch adapters. They verify application behavior, not live AWS configuration. The older CCT suite still demonstrates mock policies and is not evidence of production enforcement.

## Deployment

Install AWS SAM CLI and configure AWS credentials. Run `scripts/deploy-backend.sh` from any directory. It builds the SAM template and opens guided deployment in `ca-central-1`; supply a random JWT secret of at least 32 characters, the Spoonacular API key, and the actual frontend origin. Keep deployment parameters containing secrets out of version control. API Gateway owns CORS. The stack provisions fresh tables with generated names: existing console-managed data is **not migrated** automatically. The API URL is a stack output.

Set `REACT_APP_API_BASE_URL` to that URL before building the frontend. For local development use `frontend/.env`. To upload a production build to an existing S3 bucket, set `FRONTEND_BUCKET` and run `scripts/deploy-frontend.sh`. Configure HTTPS static hosting and SPA fallback separately. No AWS changes are performed by local tests. Configure an SNS action on the provisioned CloudWatch error alarm for notifications. User tables are retained on stack deletion; disaster recovery and backup retention need explicit operational decisions (history backups are not enabled by this template).
