# Trust Model – PantryPal

## Overview
The trust model defines the boundaries, relationships, assumptions, and mechanisms that ensure the security, privacy, and reliability of PantryPal. It explains who or what the system trusts, under what conditions, and how trust is enforced. This is particularly important given that PantryPal interacts with external recipe APIs, and collects user-provided ingredient lists while complying with privacy regulations like CCPA.

---

## Entities
- **User:** Interacts with the client app to request recipe suggestions. Provides ingredient lists and optionally dietary preferences.  
- **Client App:** Web or mobile front-end that communicates with the backend over HTTPS.  
- **API Gateway:** Validates requests, enforces authentication, rate limits, and blocks malicious input.  
- **AWS Lambda (SuggestMeals):** Computes recipe suggestions dynamically, fetches data from external APIs, and applies heuristics for substitutions and ranking.  
- **DynamoDB:** Stores telemetry and anonymized logs; enforces TTL policies for retention.  
- **External Recipe APIs (Spoonacular, Edamam):** Supplies recipe data; responses are assumed accurate, sanitized, and properly attributed.  
- **Monitoring/Logging (CloudWatch):** Tracks system events and metrics, while redacting sensitive user data.

---

## Trust Relationships
| Trustor | Trustee | Purpose of Trust |
|---------|---------|-----------------|
| Client App | API Gateway | Requests are authenticated, validated, and safe to process. |
| API Gateway | Lambda | Input is schema-validated, rate-limited, and adheres to privacy constraints. |
| Lambda | DynamoDB | Data operations are secure and enforce retention and anonymization policies. |
| Lambda | External Recipe APIs | Responses are accurate, attributed, and free of sensitive PII. |
| System Owners / DevOps | CloudWatch | Logs and metrics are collected reliably, with sensitive data redacted. |

---

## Assumptions & Guarantees
**Assumptions:**  
- External recipe APIs provide accurate, reliable, and sanitized data.  
- DynamoDB enforces encryption, private access, and retention policies.  
- TLS/HTTPS secures all communication between components and clients.  
- Users follow acceptable use policies; misuse is rate-limited.  

**Guarantees:**  
- User PII is never exposed in logs, analytics, or API requests.  
- All ingredient data is anonymized or aggregated before storage.  
- API Gateway enforces authentication, validation, and rate limits.  
- Data retention limits (DynamoDB TTL: 30d, optional cache: 1–6h) are enforced.  
- Recipe attribution is preserved for all surfaced content.  

---

## Mechanisms Enforcing Trust
- **Authentication & Authorization:** JWT tokens for client requests; least-privilege IAM roles for Lambda and storage access.  
- **Input Validation & Security:** API Gateway schema validation, rate limiting, body redaction, and allow-list enforcement.  
- **Data Protection & Privacy:** DynamoDB TTL, geotile anonymization, timestamp jitter, and ephemeral cache reduce risk of re-identification.  
- **Communication Security:** TLS/HTTPS ensures secure client-to-backend communication.  
- **Observability & Monitoring:** CloudWatch collects logs, metrics, and traces, with PII redaction policies applied.  
- **Fallback & Resilience:** Circuit breakers, retries, and stale-mode responses ensure reliability without exposing sensitive data during external API failures.  

---

## Failure Modes
- **External API failure:** System serves cached or partial results with `stale:true` flag; Lambda logs retry attempts and triggers alerts.  
- **IAM misconfiguration:** Access is denied rather than exposing sensitive information.  
- **Invalid user input:** API Gateway blocks or sanitizes requests before processing.  
- **Telemetry uniqueness:** Even anonymized geotiles may allow re-identification; mitigated via aggregation and timestamp jitter.  
- **Ethical/Compliance violations:** Data deletion endpoints enforce GDPR/CCPA compliance; tests verify deletion and retention limits.
