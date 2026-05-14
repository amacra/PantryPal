# ADR 001: Use AWS Serverless Stack for PantryPal

**Status:** Modified  

## Key Requirements
- Fast query responses to maximize user engagement.
- Minimal operational overhead and pay-per-use billing.
- Secure handling of user telemetry and ingredient data.
- Integration with external recipe APIs (Spoonacular, Edamam) without exposing PII.

## Decision
Adopt a fully serverless AWS architecture using:

- **API Gateway**: ingress, schema validation, rate limiting, and security.
- **AWS Lambda**: `SuggestMeals` function to compute top recipes dynamically.
- **MemoryDB (Redis)**: caching recent recipe queries (TTL 1–6h) to reduce Lambda invocations and external API calls.
- **DynamoDB**: telemetry and logging (TTL 30d) with anonymized geotiles and timestamp jitter to protect privacy.
- **CloudFront** (optional): edge caching responses (TTL 5m) to reduce latency.

## Consequences / Trade-offs

**Pros:**  
- Pay-per-use model reduces idle server costs.  
- Serverless scaling automatically adjusts to traffic spikes.  
- Cache layer reduces repeated calls to external APIs, improving performance and cost-efficiency.  
- TTLs enforce data retention policies for compliance.  

**Cons:**  
- Cold starts in Lambda may slightly increase latency for infrequent requests.  
- Reliance on multiple AWS managed services increases vendor lock-in.  
- External API dependency may cause occasional failures; mitigated by retries, circuit breakers, and caching.  

## Alternatives Considered
- Traditional EC2 + containerized app: more control but higher operational overhead and cost.  
- In-memory cache inside Lambda: simple but ephemeral and not shared across invocations.  
- DynamoDB only (no Redis): cheaper but increased Lambda execution time and API calls.  

---

# ADR 002: Refine AWS Serverless Stack (Remove MemoryDB/Redis and CloudFront)

**Status:** Accepted  

## Context
After considering the initial design in **ADR 001**, we reassessed our architecture and determined that **MemoryDB/Redis and CloudFront** are not necessary for the current use case.  

## Decision
Adopt the same serverless AWS stack as ADR 001, **but remove**:

- **MemoryDB (Redis) caching**: DynamoDB queries and optimized Lambda logic are sufficient for performance and cost requirements.  
- **CloudFront edge caching**: Responses are largely dynamic and user-specific, making edge caching ineffective.  

### Updated Architecture
- **API Gateway**: ingress, schema validation, rate limiting, and security.  
- **AWS Lambda**: `SuggestMeals` function to compute top recipes dynamically.  
- **DynamoDB**: telemetry and logging (TTL 30d) with anonymized geotiles and timestamp jitter.
- **CloudWatch**: oberservability and alarms.

### Reasons Against Removed Components
| Component | Reasoning |
|-----------|-----------|
| MemoryDB (Redis) | Additional operational complexity and cost outweighed the performance gain; DynamoDB and Lambda optimizations suffice. |
| CloudFront | Most responses are dynamic/personalized, making caching largely ineffective; avoids additional configuration and cost. |

## Consequences / Trade-offs

**Pros:**  
- Simpler architecture, easier to maintain.  
- Reduced AWS service costs.  
- DynamoDB alone meets latency and throughput targets.  

**Cons:**  
- Cold starts in Lambda may slightly increase latency for repeated queries.  
- External API dependency may occasionally cause higher latency.  

## Alternatives Considered
- Reintroduce MemoryDB or CloudFront if traffic grows and latency becomes a problem.  
- Use DynamoDB caching strategies (e.g., TTLs, query optimization).  

## Scalability, Failover, and Future Extensibility
- Serverless stack scales automatically with traffic; Lambda concurrency supports bursts.  
- DynamoDB provides multi-AZ redundancy and point-in-time recovery.  
- Optional caching layers or edge services could be added later if needed.
