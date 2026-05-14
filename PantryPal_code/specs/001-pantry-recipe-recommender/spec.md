# Feature Specification: PantryPal Meal Recommender

**Feature Branch**: `001-pantry-recipe-recommender`  
**Created**: 2025-11-26  
**Status**: Draft  
**Input**: User description: "Build a meal-recommender application called PantryPal. The purpose is to help users discover recipes they can cook based on a list of ingredients they already have, while respecting their dietary restrictions and privacy.  

Requirements:

1. As a user, I want to input a list of ingredients I have on hand (text list or simple UI list) so that PantryPal returns a ranked list of recipes I can cook now.  
   Acceptance: WHEN I submit ingredients THEN system returns a list of recipe suggestions, each with cooking instructions, ingredient list, and metadata (source name, URL, license).  

2. As a user, I want the results to exclude recipes containing any allergens or dietary restrictions I specified earlier, so I never get unsafe suggestions.  
   Acceptance: WHEN I supply a dietary profile with exclusions THEN none of the returned recipes contain excluded allergens.  

3. As a user, I want recipe output to preserve full attribution (source name, URL, license) so I know where the recipe comes from.  
   Acceptance: WHEN recipes are returned THEN each includes source attribution metadata.  

4. As a user, I want the possibility for ingredient substitutions (e.g. swap almond milk for oat milk) only if the substitution is verified, so I get realistic alternatives without incorrect guesses.  
   Acceptance: WHEN I request substitutions THEN system only offers substitutions verified via external data (no AI-made guesses).  

5. As a user, I want default performance: results should be returned quickly (low latency) and reliably, so using PantryPal feels responsive.  
   Acceptance: WHEN I send a valid request THEN response is returned within acceptable delay (< threshold) — errors or timeouts should be handled gracefully.  

6. As a user concerned about privacy, I want assurances that no sensitive personal data (health info, precise location) is collected or stored.  
   Acceptance: THE system SHALL not store any health data, location data, or other sensitive user PII.  

7. As a user, I want the ability to delete my account/data fully, so I can control my personal data.  
   Acceptance: WHEN I trigger deletion THEN all data linked to my account/tenant ID is permanently removed.  

8. As a developer/maintainer, we want fallback behavior if external recipe APIs are down: serve cached (up to 24h) results with a flag indicating staleness.  
   Acceptance: WHEN external API fails AND cached results exist (≤ 24h old) THEN return results with `stale:true`; otherwise return an error or deprecated message.  

9. As product owner, we want the application to function under typical load without high costs, and scale reasonably for bursts, without violating data-retention or privacy constraints.  
   Success metrics: cache hit rate ≥ 80%, average latency and 95th-percentile latency within acceptable bounds, data retention ≤ 30 days, data residency in Canada, approved external endpoints only.  

Additionally, describe constraints: no collection of location or health data; all user data stored in Canada; external recipe APIs only (e.g. Spoonacular or Edamam).  
Note (2025-11-29): External recipe API requests will be allowed as direct calls from services running in `ca-central-1` to approved vendors, but only minimal/anonymized ingredient fields will be sent and explicit user consent will be logged for such requests. This reduces cross-border data exposure while keeping latency and cost lower than a full Canada‑proxy. Residual cross‑border risk is acknowledged and a Vendor Data Processing Agreement (DPA) is recommended where vendors process data outside Canada.

Include user stories, acceptance criteria, edge cases (empty input, invalid ingredients, allergic profile blank, substitution request for unknown ingredients, external API failure, deletion request, cache stale scenario).  

Explain why each requirement exists (user need / stakeholder need / privacy constraint / performance constraint)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Input Ingredients and Get Recipe Suggestions (Priority: P1)

As a user, I want to input a list of ingredients I have on hand so that PantryPal returns a ranked list of recipes I can cook now, each with cooking instructions, ingredient list, and metadata (source name, URL, license).

**Why this priority**: This is the core functionality of PantryPal, enabling users to discover recipes based on available ingredients, delivering immediate value as an MVP.

**Independent Test**: Can be fully tested by submitting a list of ingredients and verifying a ranked list of recipes is returned with required metadata.

**Acceptance Scenarios**:

1. **Given** a user has a list of ingredients (e.g., "chicken, rice, carrots"), **When** they submit the list, **Then** the system returns a ranked list of recipes that can be made with those ingredients, each including cooking instructions, full ingredient list, and attribution metadata.
2. **Given** no matching recipes exist for the ingredients, **When** the user submits, **Then** the system returns an empty list or a message indicating no recipes found.

**Why this requirement exists**: User need - helps users utilize available pantry items efficiently without waste.

---

### User Story 2 - Exclude Recipes with Allergens (Priority: P2)

As a user, I want the results to exclude recipes containing any allergens or dietary restrictions I specified earlier, so I never get unsafe suggestions.

**Why this priority**: Ensures safety and trust; critical for users with allergies, but can be added after core functionality.

**Independent Test**: Can be tested by setting up a dietary profile with exclusions and verifying no returned recipes contain those allergens.

**Acceptance Scenarios**:

1. **Given** a user has specified allergens (e.g., "nuts"), **When** they request recipes, **Then** none of the returned recipes contain nuts in their ingredients.
2. **Given** a user has no dietary profile set, **When** they request recipes, **Then** all recipes are returned without exclusions.

**Why this requirement exists**: User need - prevents health risks from unsafe food suggestions; privacy constraint - handles sensitive dietary data carefully.

---

### User Story 3 - Preserve Recipe Attribution (Priority: P3)

As a user, I want recipe output to preserve full attribution (source name, URL, license) so I know where the recipe comes from.

**Why this priority**: Builds trust and legal compliance; can be implemented after core features.

**Independent Test**: Can be tested by requesting recipes and verifying each includes source attribution metadata.

**Acceptance Scenarios**:

1. **Given** recipes are returned from external sources, **When** the response is generated, **Then** each recipe includes attribution metadata (source name, URL, license).
2. **Given** cached recipes are served, **When** the response is generated, **Then** attribution is preserved from the original source.

**Why this requirement exists**: Stakeholder need - legal and ethical compliance with recipe sources; user need - transparency.

---

### User Story 4 - Verified Ingredient Substitutions (Priority: P4)

As a user, I want the possibility for ingredient substitutions only if verified, so I get realistic alternatives without incorrect guesses.

**Why this priority**: Enhances usability for ingredient shortages; lower priority as it's an enhancement.

**Independent Test**: Can be tested by requesting substitutions for a missing ingredient and verifying only verified alternatives are offered.

**Acceptance Scenarios**:

1. **Given** a recipe requires an ingredient the user lacks, **When** they request substitutions, **Then** only verified substitutions from external data are offered.
2. **Given** no verified substitutions exist, **When** requested, **Then** no substitutions are suggested.

**Why this requirement exists**: User need - flexibility in cooking; performance constraint - avoids unreliable AI guesses.

---

### User Story 5 - Fast and Reliable Performance (Priority: P5)

As a user, I want results returned quickly and reliably, so using PantryPal feels responsive.

**Why this priority**: User experience; foundational for all interactions.

**Independent Test**: Can be tested by measuring response times and error rates under load.

**Acceptance Scenarios**:

1. **Given** a valid request, **When** submitted, **Then** response is returned within acceptable delay (e.g., < 2 seconds average).
2. **Given** system errors occur, **When** requests are made, **Then** graceful error handling (e.g., retry or informative messages) is provided.

**Why this requirement exists**: User need - responsive app; performance constraint - ensures usability.

---

### User Story 6 - Privacy Assurances (Priority: P6)

As a user concerned about privacy, I want assurances that no sensitive personal data is collected or stored.

**Why this priority**: Builds trust; critical for privacy-focused users.

**Independent Test**: Can be tested by auditing stored data and verifying no sensitive fields are present.

**Acceptance Scenarios**:

1. **Given** user interactions, **When** data is stored, **Then** no health data, location data, or other sensitive PII is collected or stored.
2. **Given** requests include sensitive data, **When** processed, **Then** such data is rejected or stripped.

**Why this requirement exists**: Privacy constraint - compliance with data protection laws; user need - peace of mind.

---

### User Story 7 - Full Data Deletion (Priority: P7)

As a user, I want the ability to delete my account/data fully, so I can control my personal data.

**Why this priority**: Privacy right; can be added later.

**Independent Test**: Can be tested by triggering deletion and verifying all linked data is removed.

**Acceptance Scenarios**:

1. **Given** a user requests deletion, **When** triggered, **Then** all data linked to their account/tenant ID is permanently removed.
2. **Given** deletion is requested, **When** completed, **Then** a confirmation is provided.

**Why this requirement exists**: Privacy constraint - GDPR/CCPA compliance; user need - data control.

---

### User Story 8 - Fallback to Cached Results (Priority: P8)

As a developer/maintainer, we want fallback behavior if external APIs are down: serve cached results up to 24h old with staleness flag.

**Why this priority**: Reliability; operational need.

**Independent Test**: Can be tested by simulating API failure and verifying cached results are served with `stale:true`.

**Acceptance Scenarios**:

1. **Given** external API fails and cached results ≤ 24h old exist, **When** request is made, **Then** cached results are returned with `stale:true`.
2. **Given** no valid cache exists, **When** API fails, **Then** an error or deprecated message is returned.

**Why this requirement exists**: Stakeholder need - system reliability; performance constraint - graceful degradation.

---

### User Story 9 - Scalable and Cost-Effective Operation (Priority: P9)

As product owner, we want the application to function under load without high costs, scaling for bursts while respecting constraints.

**Why this priority**: Business sustainability; ongoing.

**Independent Test**: Can be tested by monitoring metrics like cache hit rate, latency, and costs.

**Acceptance Scenarios**:

1. **Given** typical load, **When** system operates, **Then** cache hit rate ≥ 80%, latencies within bounds, data retention ≤ 30 days, residency in Canada, only approved endpoints used.
2. **Given** burst load, **When** occurs, **Then** system scales reasonably without violating constraints.

**Why this requirement exists**: Stakeholder need - cost control and scalability; performance constraint - efficient operation.

### Edge Cases

- **Empty input**: When user submits no ingredients, system returns a message prompting for input or suggests popular recipes.
- **Invalid ingredients**: When ingredients are not recognized (e.g., typos), system attempts fuzzy matching or excludes them and proceeds with valid ones.
- **Allergic profile blank**: When no exclusions are set, all recipes are eligible.
- **Substitution request for unknown ingredients**: When substitution is requested for an ingredient not in the recipe, no substitutions are offered.
- **External API failure**: System falls back to cache if available and fresh; otherwise, returns error.
- **Deletion request**: Ensures all tenant-linked data (cache, DB) is wiped; handles partial failures gracefully.
- **Cache stale scenario**: When cache is >24h old, treats as no cache and returns error instead of stale data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept a list of ingredients from the user and return a ranked list of recipes that can be made with those ingredients, including cooking instructions, ingredient list, and metadata (source name, URL, license).
- **FR-002**: System MUST exclude recipes containing any user-specified allergens or dietary restrictions from results.
- **FR-003**: System MUST preserve full attribution metadata (source name, URL, license) for each returned recipe.
- **FR-004**: System MUST only offer ingredient substitutions that are verified via external data, not AI-generated guesses.
 - **FR-004**: System MUST only offer ingredient substitutions that are verified via external data, not AI-generated guesses. The primary verified substitution source will be a trusted public registry (e.g., `OpenFoodFacts` or USDA food composition data). Vendor lists may be consulted as secondary sources but the public registry should be the authoritative source for substitution recommendations.
- **FR-005**: System MUST return responses within acceptable latency thresholds and handle errors/timeouts gracefully.
- **FR-006**: System SHALL NOT store any health data, precise location data, or other sensitive PII.
- **FR-007**: System MUST provide a mechanism to fully delete all user data linked to an account/tenant ID.
- **FR-008**: System MUST serve cached results (up to 24h old) with `stale:true` flag when external APIs are down, otherwise return an error.
- **FR-009**: System MUST operate under typical load with cache hit rate ≥ 80%, acceptable latencies, data retention ≤ 30 days, data residency in Canada, and only approved external endpoints.
- **FR-010**: System MUST comply with PIPEDA principles: obtain consent for data collection, limit collection to ingredients and dietary profiles for recipe matching, use data only for stated purpose, retain data ≤ 30 days, ensure accuracy of user-provided data, implement safeguards (encryption, access controls), provide openness via privacy policy, allow individual access and correction, and offer recourse for privacy complaints.
- **FR-011**: System MUST not disclose personal information to third parties without consent, and data must remain in Canada.

### PIPEDA Compliance Details

The following outlines how each of the 10 PIPEDA principles is enforced in PantryPal:

1. **Accountability**: A designated "privacy steward" monitors CloudWatch logs for access violations.
2. **Identifying Purposes**: /privacy endpoint clearly states the only purpose: "Provide personalized recent searches and faster suggestions."
3. **Consent**: Users explicitly consent during signup; no search history is stored until consent is given. Consent audit records (user ID, timestamp, scope of consent) will be retained for **30 days** to support accountability and audits, and will be deleted alongside other user data on deletion requests.
4. **Limiting Collection**: Only email/username + salted password hash + last 10 search strings are stored — nothing else.
5. **Limiting Use, Disclosure & Retention**: Search history capped to 10 entries; oldest entries automatically deleted. No sharing or exporting to third-party vendors.
6. **Accuracy**: Users can overwrite search history via /clear_history.
7. **Safeguards**: Passwords hashed with bcrypt/argon2. DynamoDB table encrypted with AWS KMS. IAM policy restricts access to login + search-table only.
8. **Openness**: /privacy and /data_use_summary endpoints publicly describe what data is stored, why, and for how long.
9. **Individual Access**: /export_my_data returns all account data + 10-item search history. /delete_my_data fully deletes the login + search record.
10. **Challenging Compliance**: /submit_privacy_request logs complaints into DynamoDB + sends SNS alert to steward.

### Key Entities *(include if feature involves data)*

- **User**: Represents a tenant with a hashed ID; has a dietary profile including allergens list.
- **Ingredient**: A pantry item submitted by user; used for recipe matching.
- **Recipe**: Returned suggestion with title, instructions, ingredients, attribution metadata.
- **DietaryProfile**: User-defined exclusions (allergens); filters recipes.
- **CacheEntry**: Stored recipe data with TTL; used for fallback.

### Identity & Sessions

- **Identity model**: PantryPal supports **optional registered accounts** (email/password) and **anonymous session tokens**. Anonymous sessions are represented by a hashed session token that persists for up to 30 days and can be used to retrieve or delete session-linked data. Registered accounts enable full export/delete workflows tied to a hashed tenant ID. This hybrid model balances privacy with the ability to honor data access and deletion requests.

- **Deletion/export notes**: Registered accounts receive full export and deletion capability as described in `FR-007` and success criteria. For anonymous sessions, data will be expired automatically after 30 days or removed immediately if the session token is presented with a valid deletion request.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can submit ingredients and receive recipe suggestions in under 2 seconds average latency.
- **SC-002**: System achieves 95th-percentile latency under 250 ms for recipe requests.
- **SC-003**: Cache hit rate is at least 80% during normal operation.
- **SC-004**: No sensitive data (health, location) is stored, verified by data audits.
- **SC-005**: Data retention is limited to 30 days maximum.
- **SC-006**: All data resides in Canada (ca-central-1 region).
- **SC-007**: Only approved external endpoints (Spoonacular, Edamam) are accessed.
- **SC-008**: User deletion removes 100% of linked data within 24 hours of request.
- **SC-009**: System handles load bursts without exceeding cost budgets per 10k requests.

## Clarifications

### Session 2025-11-26

- Q: How will user consent for data collection be obtained and recorded? → A: Users explicitly consent during signup; no search history is stored until consent is given.

### Session 2025-11-29

- Q: How should external recipe API requests be routed to meet data-residency and compliance requirements? → A: Option B — Allow direct calls to approved vendors from services running in `ca-central-1`, but send only minimal/anonymized ingredient fields and log explicit user consent. Residual cross-border risk acknowledged; obtain Vendor DPA where feasible.

- Q: How long should consent records be retained for audit/compliance? → A: Option B — Retain consent audit records for 30 days (same as data retention policy).

- Q: What is the SLA for deleting all user-linked data after a deletion request? → A: Option A — Delete all user-linked data within **24 hours** of request (confirming the existing success criteria).

- Q: What source should be used to verify ingredient substitutions? → A: Option B — Use a trusted public registry (e.g., `OpenFoodFacts` or USDA) as the primary substitution source; vendor lists may be secondary.

- Q: How should user identity be handled (accounts vs anonymous sessions)? → A: Option B — Support optional accounts with anonymous session tokens by default (anonymous sessions persist up to 30 days; registered accounts enable export/delete operations). This balances UX, minimal PII collection, and compliance needs.
