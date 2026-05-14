**Clarifications Summary — PantryPal Meal Recommender

Recorded session: 2025-11-29

- **Q: External API routing** → **A: Option B**
  - Decision: Allow direct calls from services running in `ca-central-1` to approved vendors (Spoonacular/Edamam), sending only minimal/anonymized ingredient fields and logging explicit user consent.
  - Implication: Implement consent logging and request-minimization middleware; document Vendor DPA expectations.
  - Updated in: `spec.md` (Constraints & Clarifications).

- **Q: Consent retention** → **A: Retain consent audit records for 30 days**
  - Decision: Keep immutable consent records (user ID/hash, timestamp, scope) for 30 days, then purge alongside other user data.
  - Implication: Define consent log schema and retention policy; include in privacy docs and audit routines.
  - Updated in: `spec.md` (PIPEDA Compliance / Clarifications).

- **Q: Deletion SLA** → **A: Option A (24 hours)**
  - Decision: Delete all user-linked data within 24 hours of a deletion request.
  - Implication: Plan job/workflow and tests to ensure cache + DB + any mappings are removed within SLA; reflect in runbook.
  - Updated in: `spec.md` (Success Criteria / Clarifications).

- **Q: Substitution source** → **A: Option B (public registry)**
  - Decision: Use a trusted public registry (e.g., `OpenFoodFacts` or USDA) as the authoritative substitution source; vendor lists may be secondary.
  - Implication: Add data-normalization and mapping step for substitution lookups; cite source in responses where applicable.
  - Updated in: `spec.md` (FR-004 / Clarifications).

- **Q: Identity model** → **A: Option B (optional accounts + anonymous tokens)**
  - Decision: Support optional registered accounts (email/password) and anonymous session tokens (persist up to 30 days). Registered accounts enable full export/delete operations; anonymous sessions expire or can be deleted with a session token.
  - Implication: Design session token lifecycle, deletion API accepting session tokens, and account-based export/delete paths. Update telemetry and consent links to session vs account contexts.
  - Updated in: `spec.md` (Identity & Sessions / Clarifications).

Notes
- All clarifications have been applied to `specs/001-pantry-recipe-recommender/spec.md` and are ready for the planning phase.
- Recommended next artifacts (no code required): `consent-log-schema.md`, `vendor-dpa-checklist.md`, and a `clarifications-summary.md` (this file) for reviewers.
