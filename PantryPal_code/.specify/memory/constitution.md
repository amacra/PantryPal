<!--
Sync Impact Report

- Version change: unknown -> 1.0.0
- Modified principles:
	- [PRINCIPLE_1_NAME] -> I. Promises (NON-NEGOTIABLE)
	- [PRINCIPLE_2_NAME] -> II. Guardrails (Controls)
	- [PRINCIPLE_3_NAME] -> III. Red Tests (SpecKit executable checks)
	- [PRINCIPLE_4_NAME] -> IV. Operational Constraints
	- [PRINCIPLE_5_NAME] -> V. Governance & Observability
- Added sections: Additional Constraints, Development Workflow & Checks
- Removed sections: none
- Templates requiring updates:
	- .specify/templates/plan-template.md: ⚠ pending (update Constitution Check gates to include PantryPal promises)
	- .specify/templates/spec-template.md: ⚠ pending (add mandatory requirements for data residency, attribution, allergen exclusion)
	- .specify/templates/tasks-template.md: ⚠ pending (ensure foundational tasks include deletion endpoint and regional deploy)
	- .specify/templates/checklist-template.md: ⚠ pending (add checks for no-location/health-data and external API allow-list)
	- .specify/templates/agent-file-template.md: ⚠ pending (reflect active constraints: AWS ca-central-1, allowed external APIs)
- Follow-up TODOs:
	- TODO(UPDATE_TEMPLATES): Adjust SpecKit templates listed above to include explicit Constitution checks for PantryPal promises.
-->

# PantryPal Constitution

## Core Principles

### I. Promises (NON-NEGOTIABLE)
PantryPal is a "What-Can-I-Cook" recommender. The system's promises are strict, testable obligations derived from the project pitch and architecture constraints. Each Promise below is enforceable by the accompanying Control and verified by a Red Test.

- Promise: Use a serverless AWS stack with the sequence API Gateway → Lambda → Redis → DynamoDB.
	- Rationale: Predictable, cost-effective serverless operations and predictable caching + long-term storage separation.

- Promise: Redis cached objects MUST have TTLs in the range 1–6 hours; DynamoDB persisted results MUST have a 30-day TTL.

- Promise: External HTTP calls are allowed ONLY to Spoonacular or Edamam.

- Promise: No precise location or health data (e.g., exact GPS coordinates, raw medical/health records) SHALL be stored.

- Promise: All data residency and compute MUST remain in Canada (`ca-central-1`).

- Promise: A deletion endpoint MUST fully and irrevocably wipe all user data linked to hashed tenant IDs (cache + DB + any mapping table).

- Promise: Every API response that includes a recipe MUST preserve recipe attribution metadata (recipe source/name/attribution string).

- Promise: Allergen exclusion declared by users MUST be strictly enforced: returned recipes must not contain declared allergens.

- Promise: The system MUST NOT provide unverified ingredient substitutions; substitution suggestions are disallowed unless explicitly marked verified.

- Promise: During upstream outages, the system MUST return cached results no older than 24 hours with `"stale": true` in the response.

- Promise: Performance & cost targets: p95 latency < 250 ms; cache hit rate > 80%; cost per 10k requests MUST stay within project budget (budget value provided to runtime via `PANTRYPAL_BUDGET_PER_10K`).

### II. Guardrails (Controls)
Each Promise above is enforced via specific controls. These controls are mandatory implementation constraints and form the operational contract.

- Control for serverless stack: Infrastructure-as-Code (CloudFormation/Terraform/CDK) templates MUST define API Gateway → Lambda → Redis (ElastiCache) → DynamoDB flow. CI deploys must reject stacks that place services outside this sequence.

- Control for TTLs: Redis cache-set operations MUST include TTL between 3600s and 21600s (1–6 hours). DynamoDB items with persisted results MUST set DynamoDB TTL attribute to 30 days at write. Lambdas must validate TTLs on write and refuse writes outside these ranges.

- Control for external calls: Lambda network egress MUST be restricted via allow-listing (VPC NAT + security policy / code-level check). Application code MUST assert the outbound host is exactly `api.spoonacular.com` or `api.edamam.com` before making requests.

- Control for sensitive data: API input schemas and request validators MUST reject or strip precise-location and health-related fields. Storage schemas and audit jobs MUST assert no columns/attributes containing `latitude`, `longitude`, `gps`, `health`, `medical`, or similar are persisted.

- Control for data residency: CI/CD deployment configuration MUST set `AWS_REGION=ca-central-1` and fail pipeline checks when other regions are used. All resource ARNs and Terraform providers MUST be region-locked to `ca-central-1`.

- Control for deletion: Implement a dedicated `DELETE /tenants/{hashedTenantId}` Lambda that:
	- atomically removes Redis keys for that hashed tenant, deletes all DynamoDB items with that tenant partition key, and removes any auxiliary mapping rows;
	- returns a proof-of-deletion event to an audit log (kept only as a deletion-proof record that does not contain raw user data);
	- is authenticated and rate-limited. The deletion operation MUST be idempotent and verifiable.

- Control for attribution: Response serialization middleware MUST attach `recipeAttribution` (source identifier and attribution text) to every recipe object returned. Responses missing this field MUST be rejected by integration tests and treated as a contract violation.

- Control for allergen exclusion: User profiles include a declared `allergens` list. Query / filter logic MUST remove any candidate recipes that contain any declared allergen. Filter steps MUST run before any ranking or substitution logic.

- Control for substitutions: The suggestion engine MUST only include substitutions when an internal `substitutionVerified` flag is present and true. By default, substitution suggestions MUST be omitted.

- Control for outage fallback: Health-checks and upstream call wrappers MUST detect Spoonacular/Edamam outages. On outage, the Lambda MUST read from Redis and only serve cached items with age <= 86400 seconds (24h), and responses MUST include `"stale": true` and `"cached_age_seconds": <age>`.

- Control for observability and cost: Application MUST emit OpenTelemetry metrics and structured logs for latency (p95), cache hits/misses, and cost estimates. Alerts MUST be configured: p95 > 250ms (page), cache hit rate < 80% (warning), and cost projection > `PANTRYPAL_BUDGET_PER_10K` (warning/ops review).

### III. Red Tests (SpecKit executable checks)
Each Promise above has a corresponding Red Test. Tests are written to be automatable and executable by SpecKit.

- test infra_stack_sequence(): condition: Verify IaC outputs show API Gateway -> Lambda -> ElastiCache(Redis) -> DynamoDB graph and pipeline rejects different sequences.

- test redis_ttl_range(): condition: Insert a test cache object and assert TTL between 3600 and 21600 seconds.

- test dynamodb_ttl_30d(): condition: Write a persisted result and assert DynamoDB TTL attribute equals 30 days from write time.

- test external_call_allowed(): condition: Static analysis / runtime egress check fails if any outbound host other than `api.spoonacular.com` or `api.edamam.com` is observed.

- test no_location_or_health_data_stored(): condition: Run a schema + data scan to assert no stored attributes or columns contain precise location or health data for any tenant.

- test resources_region_ca_central_1(): condition: Assert deployed resource ARNs and config use `ca-central-1` region.

- test deletion_endpoint_wipes_data(): condition: Create test tenant data (cache + DB), call deletion endpoint, assert zero records remain for that hashed tenant id in Redis and DynamoDB.

- test recipe_source_field(): condition: For any recipe-returning endpoint, assert `recipeAttribution` field exists and matches the upstream source metadata.

- test allergen_exclusion(): condition: Given a user with allergen `X`, run query and assert returned recipes contain no ingredients or metadata matching `X`.

- test no_unverified_substitutions(): condition: For a sample request where substitution would be offered, assert response contains no substitution unless `substitutionVerified==true`.

- test stale_cache_fallback(): condition: Simulate upstream outage, request a recipe previously cached; response MUST have `"stale": true`, `cached_age_seconds <= 86400`, and status 200.

- test_perf_p95_under_250ms(): condition: From production telemetry or a load test harness, assert measured p95 latency < 250 ms over the evaluation window.

- test_cache_hit_rate_above_80(): condition: From cache metrics, assert hit rate >= 80% over the evaluation window.

- test_cost_per_10k_within_budget(): condition: From billing telemetry, compute cost per 10k requests and assert <= `PANTRYPAL_BUDGET_PER_10K`.

### IV. Operational Constraints
These are explicit constraints the runtime and CI/CD must uphold (restate of architecture + operational expectations).

- Stack: `API Gateway -> Lambda -> Redis (ElastiCache) -> DynamoDB` deployed to `ca-central-1` only.
- Cache TTLs: Redis 1–6 hours. Persistence TTL: DynamoDB 30 days.
- Allowed external APIs: `api.spoonacular.com`, `api.edamam.com` only.
- Data stored: No precise location or health-related data fields permitted.
- Deletion: `DELETE /tenants/{hashedTenantId}` MUST remove cache + DB rows and provide verifiable audit of deletion.

### V. Governance & Observability
Amendments, versions, and compliance checks for PantryPal.

- Amendment procedure: Changes to this Constitution MUST be proposed as a spec PR that includes: the proposed change, rationale, migration plan for infra/data, and red-test updates. A constitution amendment requires approval by the project maintainers (2 approvers) and passing the full Red Test suite in CI.

- Versioning policy: Semantic versioning for the Constitution file. Initial ratification sets **Version** to `1.0.0`. MAJOR bumps indicate backward-incompatible governance changes. MINOR bumps for adding principles or materially expanding guidance. PATCH bumps for wording, typos, or clarifications.

- Compliance review: Every release pipeline must run the Red Tests. Failures are treated as gating violations and block deployment until resolved.

- Observability: Export latency and cache metrics to a monitoring system. Alerts defined in the Guardrails section MUST be actionable and routed to on-call.

## Additional Constraints
These are short reminders and mandatory operational settings.

- Region and residency: All resources and data are Canada-only (`ca-central-1`).
- Budget control: `PANTRYPAL_BUDGET_PER_10K` environment variable MUST be set in production and used by billing-alert rules.

## Development Workflow & Checks

- PRs modifying infra, cache behavior, deletion logic, or external API calls MUST include updated Red Tests and a local reproducible test demonstrating the change.
- CI MUST run the SpecKit Red Test suite and block merges on failures.

## Governance

Amendments require documented migration plans and two maintainer approvals. All PRs must include a Constitution compliance checklist showing which Promises/Controls are affected and how the change preserves or migrates them.

**Version**: 1.0.0 | **Ratified**: 2025-11-26 | **Last Amended**: 2025-11-26
