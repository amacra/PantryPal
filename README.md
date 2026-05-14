# PantryPal – “What-Can-I-Cook” Recommender
capstone code repository: https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project 

## Problem & Stakeholders

**Scenario Summary:**  
PantryPal returns three cookable recipes from a user’s ingredient list via a small API and web UI. Data stays in AWS ca-central-1 with minimal collection, 30-day retention, and a deletion path.

**Stakeholders:** home cooks reducing waste, students needing fast ideas, and recipe publishers whose links we surface.  

**Empty chair:** users with low literacy/vision; UI uses simple, high-contrast React layouts. Full “read aloud” and WCAG 2.1 AA audit are next.

**Goals/metrics:** decision time to a usable set <3s; ≥40% click-through on one suggestion; `/suggest` p95 <1s with low error rate.

---

## Architecture & Trade-offs

> The final system is a fully serverless AWS stack, documented in more detail in our code repo:
> - System Design Artifacts/architecture_diagram.png
> - System Design Artifacts/adr.md

![Architecture Diagram](architecture_diagram.png)

**Trust Boundaries:**  
Edge (public) → API Gateway (rate-limit + auth) → Lambda (private execution) → DynamoDB/S3 (private data).

**Repository vs Deployment Reality**  
At submission time, the Git repository was treated as the authoritative artifact for verification. Parts of the backend Lambda logic deployed in AWS were not consistently reflected in version control, creating an epistemic gap between documented behavior, verifiable code, and production configuration. Where this gap exists, we treat the repository—not the deployed console state—as the ground truth for evaluation and explicitly downgrade affected controls below.

**Trade-offs Considered:**   

***Caching vs Simplicity***  
Early designs (ADR 001) considered MemoryDB/Redis and CloudFront for aggressive caching of repeated queries. After formative feedback, we decided:
- No dedicated cache layer for this MVP.
- Rely on:
  - Spoonacular’s own ranking and caching,
  - DynamoDB for lightweight history storage,
  - and relatively low expected traffic.
- Pros (no Redis/CloudFront):
  - Fewer services to secure, configure, and pay for.
  - Simpler Clause→Control→Test story and smaller attack surface.
- Cons:
  - More direct calls to the external recipe API.
  - p95 latency is acceptable for an MVP but not as optimized as it could be with caching.

***Vendor Dependency vs In-House Recipe Store***  
We rely on Spoonacular as the primary recipe source:
- Pros:
  - We avoid building and maintaining our own scraper/crawler.
  - Faster time to MVP and fewer data quality concerns on our side.
- Cons:
  - Vendor lock-in, API pricing dependence, and risk of outages.
  - Attribution and licensing must be respected.  

We treat an in-house dataset or ML ranking pipeline as a future phase that could plug into the same Lambda/API Gateway interface.

***Serverless vs Containers***
We chose API Gateway + Lambda over ECS/Fargate:
- Pros of serverless:
  - Pay-per-use, automatic scaling, no server management.
  - Matches bursty, student-project workloads.
- Cons:
  - Cold starts, function timeout limits.
  - Less control over runtime environment for heavy ML workloads (which we don’t yet use).  

If we later add heavier models or a custom recommender, we can introduce a containerized microservice behind the same API Gateway without breaking the frontend.

**Final ADR Summary**
Our ADR file captures this evolution:
- ADR 001 – Use AWS Serverless Stack
  - Initial decision: API Gateway + Lambda + DynamoDB, with optional MemoryDB and CloudFront.
- ADR 002 – Refine Stack (Remove MemoryDB/Redis and CloudFront)
  - Final decision: API Gateway + Lambda + DynamoDB + CloudWatch only.
  - Rationale: simpler architecture, easier to secure and document for PIPEDA, and cheaper to operate at our scale.

The report you’re reading reflects ADR 002 as the final architecture.


### Scalability, Failover, and Future Extensibility

**Scalability:**  
- The serverless stack scales automatically with traffic.  
- Lambda concurrency can burst to thousands of parallel executions. 
- DynamoDB offers on-demand capacity mode, supporting sudden spikes in recipe queries without pre-provisioning throughput.  

**Failover & Reliability:**  
- DynamoDB provides built-in multi-AZ redundancy and automatic point-in-time recovery.  
- API Gateway and Lambda are region-level managed services with no single-server failure modes.  
- The application degrades gracefully by falling back to DynamoDB or directly re-fetching from the external recipe API (at higher latency/cost but without losing functionality).

**Future Extensibility:**  
- The architecture can easily replace external recipe APIs with an in-house crawler/ML ranking pipeline without rewriting the client or API Gateway layer.  
- A containerized service (ECS/Fargate) can be introduced later if long-running tasks or model hosting become necessary.  
- DynamoDB TTLs and item schemas can evolve without schema migrations, enabling richer analytics or user history features.  
- Additional microservices—e.g., recommendations, dietary preference learning, or shopping list optimizer—can integrate through the same API Gateway or event-driven patterns (SNS/SQS/EventBridge).

---

## Clause → Control → Test & Ethics

> Our PIPEDA-aligned Clause→Control→Test mapping lives in our code repo:
> - CCT_ethics_dept/clause_control_test.md
> - CCT_ethics_dept/telemetry-ethics.md

The core of the implementation is:
- Minimal data in two tables (Users, UserSearchHistory).
- Short retention (~30-day TTL).
- On-demand deletion (/delete_account).
- Spec tests to check that our promises and implementation stay aligned.

| #  | PIPEDA Principle   | Clause (What We Promise)  | Control (How We Implement It)  | Test (How We Verify It) |
| -- | ------------------ | ------------------------- | ------------------------------ | ----------------------- |
| 1  | Accountability                       | We are responsible for all personal data under our control.                 | Only two DynamoDB tables (`Users`, `UserSearchHistory`) hold user data; telemetry matrix and ethics ledger explicitly document all stored fields.   | `test_data_inventory_spec` – asserts table shapes match docs and no extra user-data tables are used.                                           |
| 2  | Identifying Purposes                 | Users know why data is collected before providing it.                       | Signup and privacy copy explain that email is for login and that a small history powers “recent suggestions” and is auto-deleted.                       | `test_purposes_match_telemetry_spec` – reuses inventory test; checks we’re not silently storing extra fields.                                  |
| 3  | Consent                              | Users can withdraw consent anytime.                                         | `/delete_account` removes user row and all history items for that user. Endpoint is defined in API schemas and frontend wiring; backend erasure logic was planned but not present in the submitted Lambda artifacts in the code repository.                           | `test_delete_account_acts_as_withdrawal_spec` and `test_delete_account_clears_all_data_spec` – create, delete, then confirm no records remain. In-memory CCT tests simulate erasure semantics but do not verify deployed backend enforcement. |
| 4  | Limiting Collection                  | We collect only what is strictly necessary.                                 | `Users` table: `UserID`, `passwordHash`, `salt`, `createdAt`. `UserSearchHistory`: `UserID`, `timestamp`, `ingredients`, `recipesPreview`, planned `expiresAt`. | `test_history_fields_minimized_spec` – inserts history via `/suggest` and asserts no unexpected fields exist.                                  |
| 5  | Limiting Use, Disclosure & Retention | Data used only for recipe suggestions; no unnecessary retention or sharing. | Intended design uses an `expiresAt` attribute with DynamoDB TTL (~30 days); however, this was not verifiable from the submitted Lambda code at grading time.  | `test_history_retention_spec` – should check `expiresAt` is present and in the future. CCT test now checks intended TTL semantics in isolation; does not validate live DynamoDB TTL configuration.                 |
| 6  | Accuracy                             | Data must be accurate and up to date.                                       | Only personal field is email; users can delete and re-signup. No additional derived attributes.                                                         | `test_recreate_account_updates_email_spec` – delete + re-signup leaves exactly one coherent user row.                                          |
| 7  | Safeguards                           | Personal data must be protected.                                            | Passwords stored as PBKDF2-SHA256 hashes with per-user salt; HTTPS-only API Gateway; DynamoDB encryption; no logging of email/password.                 | `test_password_not_plaintext_spec` – ensures passwordHash isn’t plaintext and uses salt.                                                       |
| 8  | Openness                             | Data practices must be transparent and documented.                          | Telemetry matrix, ethics ledger, API docs, and this report all describe data flows and retention.                                                       | `test_docs_cover_all_data_flows_spec` – basic reachability check that tables and documented fields exist.                                      |
| 9  | Individual Access                    | Users can remove (and, in future, access) their data.                       | `/delete_account` clears records. Full “view my data” UI and export are explicitly deferred.                                                            | `test_access_via_support_process_spec` – currently partially implemented; acknowledges deletion but not full access UI.                        |
| 10 | Challenging Compliance               | Users can challenge practices via deletion.                                 | For MVP, “challenge” is modeled as deleting the account and data; future work would add a more formal contact process.                              | `test_delete_account_clears_all_data_spec` – ensures the erasure path actually does what it claims.  |

**Design Note: Fixed 10-Item History Cap**  
In the code repository controls, a 10-item-per-user history limit was mentioned alongside a ~30-day retention policy. In practice, the system relied solely on DynamoDB’s time-based TTL as a data minimization mechanism, under the assumption that automatic expiry was sufficient to bound retained personal data. While TTL does limit long-term accumulation, it does not enforce a strict upper bound on per-user history volume. Treating TTL as equivalent to a fixed item cap was therefore incorrect. This mismatch represents a failure of documentation precision.

**Repository vs Deployed Lambda Inconsistency**  
A further shortcoming in the CCT evidence stems from inconsistency between the Lambda functions deployed via the AWS Console and the versions committed to the code repository. Some backend logic evolved during development but was not consistently checked into version control. Because the repository is the only externally verifiable artifact, any behavior not reflected there must be treated as non-existent for the purposes of Clause→Control→Test reasoning. This gap weakened the traceability between claimed controls and observable mechanisms.

**Mocked Tests and the Limits of Verification**  
All CCT tests operate on in-memory mocks and simulated responses rather than deployed AWS infrastructure. These tests were useful for validating conceptual alignment between promises and intended behavior, but they do not verify that controls are actually enforced in production. Presenting these mocked tests as verification evidence therefore overstated their strength: they demonstrate design intent, not operational guarantees. This created a “silent green bar,” where passing tests masked the absence of end-to-end enforcement.


### Ethics Debt Ledger
| ID   | Harm / Stakeholder | Description  | Current Mitigation  | Planned Fix / Future Work  | Status   |
| ---- | ------------------ | ------------ | ------------------- | -------------------------- | -------- |
| E-01 | Privacy risk from ingredient + email linkage | Ingredient lists + email can reveal diet or possible health conditions. | Intended 30-day TTL via expiresAt; enforcement incomplete in submitted backend artifacts. | Explore user-visible “clear history” UI and optional anonymous mode.  | Mitigated, residual risk acknowledged |
| E-02 | Password security   | If passwords were mishandled, users could be exposed to credential stuffing elsewhere. | PBKDF2-SHA256 + per-user salt; no plaintext storage; no logging of credentials.  | Future upgrade to Argon2id and stricter password policies.  | Mitigated for MVP  |
| E-03 | External API dependency (Spoonacular)  | Outages or latency could make the service unusable, or trigger cost spikes.  | Circuit breaker and kill switch logic prototyped and locally tested; not integrated into the submitted Lambda execution path.  | Tighter CloudWatch alerts and auto-toggling kill switch based on error thresholds. | Mitigated for availability  |
| E-04 | Incomplete access rights  | Users can delete data but cannot yet export or inspect all records from UI.  | `/delete_account` endpoint defined, but implementation cannot be verifiable in unsubmitted lambda artifacts; minimal schema reduces surprise.   | Add “My Data” view + export endpoint in a future iteration.   | Open   |
| E-05 | Fairness / cuisine diversity | Relying solely on Spoonacular ranking may over-represent certain cuisines.  | No additional biased re-ranking; primarily ingredient match driven. | Add filters and diversity checks; collect feedback on variety.  | Open  |


## Personally Identifiable Information (PII) Handling

| Category | Details | Mitigations / Notes |
|----------|---------|------------------|
| **Collected PII** | Email address (used as `UserID`), password (stored only as salted hash), ingredient lists tied to email, recipe titles viewed. | Email is the only direct identifier. Passwords hashed + random salt. No names, addresses, or health fields. |
| **Sensitive Inference Risk** | Ingredients can imply diet, religion, or health conditions. | 30-day TTL; no logs of raw PII; |
| **Storage & Protection** | All data stored in AWS `ca-central-1` in DynamoDB.  | DynamoDB encrypted at rest; access via least-privilege IAM roles from Lambdas; everything behind API Gateway. |
| **Retention** | `Users` rows kept until account deletion. `UserSearchHistory` items: each with `expiresAt` (~30 days). | DynamoDB TTL intended to be configured on `expiresAt` |
| **User Controls** | Delete account (credentials + history). | `/delete_account` clears both tables; access/export UI TBD but acknowledged as future work. |
| **Usage** | Login & basic personalization; “recent searches” UX (not yet implemented); | No ad network sharing; Spoonacular only receives ingredients, never email/UserID. |

---

## Reliability, Cost & Operability

### Reliability & Chaos Findings

> Reliability evidence is documented in our code repo:
> - `docs/reliability-evidence.md`
> - `experiments/chaos/2025-12-03-chaos.log`
> - `experiments/chaos/2025-12-03-cloudwatch-excerpt.log`
> - `Cost and Operability/backpressure_killswitch.md`

**Key reliability mechanisms explored and locally validated::**
- Circuit breaker (opossum) around Spoonacular calls:
  - Times out slow calls.
  - Opens the circuit after repeated failures.
  - While open, returns a fallback with stale: true.
- Manual kill switch via CALL_EXTERNAL_API environment variable:
  - When set to false, Lambdas bypass Spoonacular and immediately return a safe empty result.
- Back-pressure:
  - API Gateway rate limits configured to prevent request floods.
  - Lambda concurrency limits reduce the blast radius of spikes.
- CCT-style local tests for operability:
  - `circuitBreakerLocalTest.js`
  - `backPressureLocalTest.mjs`
  - `killSwitchLocalTest.js`

During simple chaos runs (simulated API failures and bursts):
- The circuit breaker correctly opened and stopped hammering Spoonacular.
- The kill switch allowed us to force fallback mode.
- Responses remained 200 with empty payloads; no 5xx spike in the chaos run.

Chaos runs demonstrated the intended behavior of fallback responses and circuit opening in local test harnesses. Because these mechanisms were not integrated into the submitted Lambda code, these results should be read as design validation rather than production guarantees.

### Cost Modeling

> Cost modeling is captured in our code repo:
> - `Cost and Operability/cost_modelling.md`

This section outlines the expected cloud costs for running PantryPal in `ca-central-1`, based on the architecture described.  
Approximate monthly bands (very rough, assuming no Redis/CloudFront):

| Usage Level | Requests / month | Ballpark AWS + API Cost | Main Drivers                                                |
| ----------- | ---------------- | ----------------------- | ----------------------------------------------------------- |
| Light       | ~1,000           | $5–15                   | AWS free tier + low Spoonacular usage, mostly testing/demo. |
| Moderate    | ~10,000          | $50–130                 | API Gateway + Lambda + Spoonacular plan start to matter.    |
| Heavy       | ~100,000         | $500–1,200              | External API calls and Lambda dominate; more tuning needed. |

Cost controls implemented:
- No extra services like Redis or CloudFront at this stage.
- Strict retention: 30-day TTL.
- Circuit breaker + kill switch designs aim to prevent runaway external API calls, but were not integrated into the submitted Lambda execution path.
- API Gateway rate limiting avoids accidental or malicious traffic spikes.

### Operability & Runbook

> Operability is documented in:
> - `Cost and Operability/incidence_playbook.md`

The incident playbook covers:
- **Detection** – CloudWatch alarms on:
  - Lambda error rate, timeouts, throttles.
  - API Gateway 5xx spikes.
  - (Future) External API error metrics.
- **Initial response** – Check dashboards, confirm whether external API or our code is at fault.
- **Containment** – Activate kill switch if cost or error rate is rising; rely on circuit breaker.
- **Recovery** – Roll back recent changes if needed, re-enable external API, monitor metrics.
- **Post-incident review** – Document root cause and, when appropriate, add a new Clause→Control→Test row and corresponding spec test.

### Future Monetization

 > Monetization (ads, Pro subscription) may offset operational costs but is **not included in this cost model**.  

PantryPal will be designed to balance operational costs with potential revenue through multiple monetization streams:

- **Free Tier with Ads:**  
  - Users on the free tier see contextually relevant ads based on the ingredients they submit and the recipes returned.  
  - Ads are targeted towards grocery stores, kitchenware, and other relevant products.  
  - This approach allows revenue generation while keeping the core service free, and provides a way to offset API calls to external recipe databases and cloud compute/storage costs.

- **Pro Subscription ($2/month):**  
  - Optional subscription includes premium features such as dietary filters (e.g., gluten-free, vegan) and grocery list export.  
  - Provides predictable, recurring revenue that can offset operational costs for higher traffic or extended features.

---

## AI / Automation Usage

Right now, PantryPal does not use a heavy ML model. Behavior is:
- The backend sends the ingredient list to Spoonacular.
- Recipes are ranked primarily by Spoonacular’s scoring plus simple local choices (e.g., truncating to top 3 suggestions).
- We do not currently derive user profiles, mood labels, or detailed embeddings.

### AI & Tooling Assistance

> We did, however, use GenAI tools to accelerate design and documentation, and we recorded this in our code repo:
> - `AICollaborationLog.md`

Example contributions:
- Drafting initial versions of:
  - the Clause→Control→Test table,
  - the telemetry-ethics snapshot,
  - and spec-style pytest tests for the CCT bundle.
- Sketching Lambda code for:
  - the circuit breaker + kill switch,
  - the /delete_account endpoint.
- Suggesting snippets for frontend wiring:
  - Axios API client,
  - auth context,
  - Delete Account button behavior.

## Reflections from Peer Design and Formative Feedback

Peer feedback pushed us in three main directions:

- Simplify the architecture and be honest about what exists.  
  Early diagrams included MemoryDB and CloudFront because they “felt right” for performance. Feedback from peers and the teaching team was that every extra service increases complexity, cost, and security surface—especially for a student project. We responded with ADR 002, removing Redis and CloudFront and updating all documentation and CCT tables to match the simpler, actually implemented stack.

- Tighten the privacy and retention story.  
  - Documented an explicit expiresAt TTL design (~30 days).
  - Specified (but did not enforce) a 10-item per-user history cap.
  - Aligned telemetry documentation so every intended stored field appears consistently across ethics and CCT artifacts.

- Make “graceful degradation” concrete.  
Reviewers asked what really happens when Spoonacular is slow or down. We clarified and implemented:
  - A circuit breaker that stops hammering the external API after repeated failures.
  - Prototyped a circuit breaker and kill switch design and exercised them via local tests.
  - Documented how graceful degradation should behave under external API failure, even though the production Lambda path did not yet enforce this.

## 
## Future Improvements and Next Steps

If we had another iteration, we would focus on:
- User data access and export (PIPEDA Principle 9)
  - Add a “My Data” page where users can view and download their recent search history (within the 30-day window) before deletion.
  - Extend the CCT bundle with new tests and UI checks for access.
- Better authentication & identifiers
  - Migrate from “email as UserID” to an opaque UUID primary key with email as an attribute.
  - Upgrade password hashing to Argon2id and adopt clearer password policies.
- Fairness and personalization controls
  - Give users more control over cuisines, dietary filters, and allergen exclusions.
  - Start measuring cuisine diversity and add tests or dashboards to catch skewed behavior.
- Deeper observability and cost controls
  - Add more granular CloudWatch dashboards and budgets tied to Spoonacular usage.
  - Optionally re-evaluate caching (Redis, CloudFront) if traffic grows, but only with a documented CCT story and updated ADR.
- Accessibility
  - Move beyond “good intentions” and run an actual WCAG 2.1 AA pass.
  - Implement at least one concrete assistive feature, such as “read aloud” or simplified mode.

This project ultimately overemphasized documented intent over implemented mechanism. While the system design reflects a reasonable understanding of privacy, resilience, and ethical controls, insufficient distinction was made between what was conceptual, locally simulated, or actually deployed. The primary failure was not missing features, but a lack of epistemic discipline in clearly labeling the status of those features.
