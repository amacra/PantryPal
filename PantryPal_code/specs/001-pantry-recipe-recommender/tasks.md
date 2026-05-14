# Tasks: PantryPal Meal Recommender

**Input**: Design documents from `/specs/001-pantry-recipe-recommender/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## 1) System Design & Correctness

- Task: Implement core API endpoints for PantryPal (e.g., /suggestMeals, deletion endpoint)
- Type: code
- Path: src/api/
- Done when: Endpoints respond correctly to valid requests and return expected data structures

- Task: Create data models for recipes, telemetry, and user preferences
- Type: code
- Path: src/models/
- Done when: Models are defined with proper schemas and relationships

- Task: Generate latest architecture diagram
- Type: doc
- Path: docs/architecture-diagram.png
- Done when: Diagram shows API Gateway → Lambda → Redis → DynamoDB flow with trust boundaries

- Task: Document ADRs for major decisions (serverless stack, cache policy, external APIs)
- Type: doc
- Path: docs/adr/
- Done when: Each ADR includes context, decision, consequences, and alternatives

- Task: Describe trust model and data flow
- Type: doc
- Path: docs/trust-model.md
- Done when: Document explains edge → API Gateway → Lambda → storage boundaries

- Task: Create API/schema documentation
- Type: doc
- Path: docs/api/openapi.yaml
- Done when: OpenAPI spec covers all endpoints with request/response schemas

## 2) Privacy & Ethics (Clause→Control→Test)

- Task: Implement guardrails for data retention TTLs, Canada-only residency, outbound allow-list, deletion endpoint, attribution, log redaction
- Type: code
- Path: src/ (various files)
- Done when: All controls from constitution are enforced in code

- Task: Implement red-bar tests for guardrails
- Type: test
- Path: tests/redbar/
- Done when: Tests pass and fail appropriately when controls are violated

- Task: Create telemetry decision matrix
- Type: doc
- Path: docs/telemetry-matrix.md
- Done when: Matrix explains what is logged, why, and retention

- Task: Snapshot ethics debt ledger
- Type: doc
- Path: docs/ethics-ledger.md
- Done when: Ledger includes current harms, mitigations, owners, and status

## 3) Reliability & Scaling

- Task: Implement load/chaos test scripts
- Type: test
- Path: tests/load/
- Done when: Scripts simulate traffic spikes and verify system stability

- Task: Add idempotency mechanisms for critical paths
- Type: code
- Path: src/services/
- Done when: Recipe fetches and cache writes are idempotent

- Task: Configure SLOs and alert descriptions
- Type: infra
- Path: docs/slo-and-alerts.md
- Done when: Document defines p95 latency, error rate, cache hit-rate SLOs and alerts

- Task: Implement/finalize DR/runbook
- Type: doc
- Path: docs/runbook.md
- Done when: Runbook covers failure modes and aligns with implemented behavior

## 4) Cost & Operability

- Task: Implement cost-aware mechanisms (TTLs, rate limits, back-pressure)
- Type: code
- Path: src/middleware/
- Done when: System enforces budget controls and optimizes for cost

- Task: Document cost model for idle vs surge use
- Type: doc
- Path: docs/cost-model.md
- Done when: Model references actual services and estimates costs

- Task: Implement back-pressure/kill-switch behavior
- Type: code
- Path: src/features/
- Done when: Feature flags and caps prevent cost overruns

- Task: Complete incident response playbook
- Type: doc
- Path: docs/runbook.md
- Done when: Playbook includes cost-related incidents and mitigations

## 5) Documentation & Demo Readiness

- Task: Write top-level README.md with setup, env vars, fixtures, smoke tests
- Type: doc
- Path: README.md
- Done when: README enables fresh clone to run end-to-end

- Task: Add deployment instructions/scripts
- Type: infra
- Path: deploy/ or docs/deploy.md
- Done when: Instructions deploy to ca-central-1 with required configs

- Task: Add references to all key artefacts
- Type: doc
- Path: README.md
- Done when: Links to architecture, ADRs, runbook, tests, etc.

## 6) AI Collaboration Log

- Task: Maintain AI collaboration log with prompts, outputs, decisions
- Type: doc
- Path: docs/ai-log.md
- Done when: Log records all AI usage for code, docs, tests with rationale

## 7) Stretch / Innovation

- Task: Implement stretch features (e.g., accessibility, advanced ranking)
- Type: code
- Path: src/features/
- Done when: Features work and are tested

- Task: Document stretch features
- Type: doc
- Path: docs/stretch-features.md
- Done when: Features are described with demos/proofs