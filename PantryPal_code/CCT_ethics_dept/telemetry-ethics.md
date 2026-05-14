# PantryPal – Telemetry & Ethics Snapshot

## 1. Telemetry Matrix – What We Store & Why

### 1.1 Table: Users

| Field         | Type                  | Purpose                     | Retention              | Sensitivity | PII?      | Notes                                       |
|--------------|-----------------------|-----------------------------|------------------------|-------------|-----------|---------------------------------------------|
| UserID       | String (email, lowercased) | User identifier / login     | Until account deletion | High        | **Yes**    | Only direct identifier we store             |
| passwordHash | String (PBKDF2-SHA256)     | Authentication (no plaintext) | Until account deletion | High        | Indirect  | Irreversible hash, never logged             |
| salt         | String (random)       | Per-user hash salt          | Until account deletion | High        | Indirect  | Stored only in `Users` table                |
| createdAt    | Number (epoch ms)     | Account creation time       | Until account deletion | Low         | No        | Used for debugging/basic metrics only       |

**Notes**

- Email is the only direct PII we store.
- We do **not** collect name, address, phone number, or other demographics.
- Passwords are never stored in plaintext; only salted PBKDF2 hashes.

---

### 1.2 Table: UserSearchHistory

| Field          | Type              | Purpose                               | Retention                                        | Sensitivity | PII?           | Notes                                                   |
|----------------|-------------------|---------------------------------------|--------------------------------------------------|-------------|----------------|---------------------------------------------------------|
| UserID         | String (email)    | Link searches to account              | **TTL ≤ 30 days**          | High        | **Yes**        | Same value as `Users.UserID`                            |
| timestamp      | Number (epoch ms) | When the search happened              | TTL ≤ 30 days              | Low         | No             | Sort key for recency                                    |
| ingredients    | Array[String]     | Ingredients user searched with        | TTL ≤ 30 days              | Medium      | **Quasi-PII** | Can imply dietary preferences or dietary restrictions   |
| recipesPreview | Array[String]     | Titles of suggested recipes           | TTL ≤ 30 days              | Low         | No             | No full recipe content or instructions stored           |
| expiresAt      | Number (epoch s)  | TTL timestamp when record auto-expires | **DynamoDB TTL: auto-delete after ~30 days**      | Medium      | No             | Used only for TTL; not exposed to the frontend          |

**Retention Controls**

- **Time cap**: `expiresAt` is set to “now + 30 days” (in epoch seconds), and **DynamoDB TTL** deletes records automatically after ~30 days.
- Result: Data is **none are older than ~30 days**.

---

### 1.3 Third-Party & Infra Data Flows

| Component / Third Party | Data Sent                          | PII?        | Notes                                                   |
|-------------------------|------------------------------------|-------------|---------------------------------------------------------|
| Spoonacular API         | `ingredients` array only           | No          | Email / UserID are never sent; requests are anonymous  |
| AWS DynamoDB            | `Users`, `UserSearchHistory`       | Yes (email) | Encrypted at rest with AWS-managed keys                |
| AWS CloudWatch          | Sanitized logs                     | Avoided     | We avoid logging emails, passwords, or tokens           |
| AWS API Gateway         | Request metadata, IP, path         | Pseudonymous| Used for throttling and monitoring                      |

---

## 2. Ethics Ledger – Key Risks & Mitigations

### E-01 Privacy: Dietary & Preference Inference

- **Risk**: Ingredients + UserID (email) can reveal dietary patterns or possible health conditions (e.g., “gluten-free”, “keto”, etc.).
- **Controls**:
  - Keep at most **10** history entries per user.
  - Use `expiresAt` + DynamoDB TTL so no history item survives beyond ~30 days.
  - Delete-account endpoint deletes all history rows for the user immediately.
- **Residual Risk**: Some preference inference is still possible within the 30-day window.
- **Status**: ✅ Mitigated with limited exposure window.

---

### E-02 Security: Password Handling

- **Risk**: Credential theft could lead to reuse on other services (credential stuffing).
- **Controls**:
  - Passwords hashed with PBKDF2-SHA256 and per-user random salts.
  - No password or hash values are logged or sent to third parties.
  - Minimal user table: no extra attributes beyond auth and basic metadata.
- **Status**: ✅ Mitigated (future: Argon2 + stronger password rules).

---

### E-03 Security: External API Dependency (Spoonacular)

- **Risk**: Spoonacular outages/latency causing poor UX or timeouts.
- **Controls**:
  - Circuit breaker (opossum) around Spoonacular calls.
  - `CALL_EXTERNAL_API` kill switch to short-circuit external calls and return a safe fallback (`recipes: [], stale: true`).
- **Residual Risk**: Results may be empty when the kill switch is active.
- **Status**: ✅ Mitigated for availability and cost.

---

### E-04 Security & Privacy: Account Deletion / Right to Erasure

- **Risk**: Users cannot remove their account and history on demand.
- **Controls**:
  - `/delete_account` endpoint deletes:
    - the user’s row from `Users`
    - all rows in `UserSearchHistory` where `UserID` matches.
  - History TTL ensures no leftovers remain beyond 30 days even if something is missed.
- **Status**: ✅ Mitigated; core erasure path implemented.

---

### E-05 Fairness: Recipe & Cuisine Bias

- **Risk**: Recipe suggestions may over-represent certain cuisines due to Spoonacular’s dataset.
- **Controls**:
  - We do not apply additional re-ranking that would further bias results.
  - We prioritize recipes that use the user’s ingredients, not a particular cuisine.
- **Ethics Debt / Future Work**:
  - Explore user feedback on variety.
  - Add an option to filter or expand cuisines in future iterations.
- **Status**: ⚠️ Partially addressed; accepted MVP trade-off.

---

## 3. Ethics Debt & Guardrails Summary

### Implemented Guardrails

- **G-001: Hashed Passwords**
  - PBKDF2-SHA256 with per-user salt in Signup Lambda.

- **G-002: Token-Based Auth (JWT, 24h TTL)**
  - `/login` issues HMAC-SHA256 JWT with 24-hour expiration for authenticated flows.

- **G-003: History Minimization**
  - Only four fields stored per history item: UserID, timestamp, ingredients, recipesPreview.

- **G-004: History Caps by Count and Time**
  - Max 10 history items per user (application logic).
  - `expiresAt` + DynamoDB TTL ensures max age of ~30 days per entry.

- **G-005: External API Kill Switch & Circuit Breaker**
  - Circuit breaker around Spoonacular calls.
  - `CALL_EXTERNAL_API` environment switch to immediately stop external calls if needed.

### Philosophy

- **Minimize data first**, then protect what is left.
- Use **managed services** (DynamoDB TTL, AWS encryption) instead of custom retention logic.
- Prefer **simple, explainable behavior** for users:  
  - “We only keep your last few searches for about a month, and you can delete everything at any time.”
