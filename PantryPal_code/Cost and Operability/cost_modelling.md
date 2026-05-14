# PantryPal – Cost Modeling (Updated Architecture)

## Overview
This document outlines the expected cloud costs for running PantryPal in `ca-central-1` based on the updated serverless architecture. The design relies on **API Gateway**, **Lambda**, and **DynamoDB** for request handling, computation, and telemetry storage.

Costs scale primarily with **number of recipe requests**, which trigger Lambda invocations, DynamoDB reads/writes, and optional external API calls.

---

## Cloud Service Costs

| Component | Usage / Configuration | Cost Considerations |
|-----------|---------------------|------------------|
| **API Gateway + WAF** | 200 RPS, 24/7 | Charged per million requests and WAF rules. Rate limiting prevents abuse and unexpected cost spikes. |
| **Lambda (SuggestMeals)** | Timeout 5s, 128 MB memory, retries x2 | Charged per invocation and duration. Without Redis, repeated external API calls may increase invocation frequency. |
| **DynamoDB (Telemetry & Logs)** | TTL 30d, anonymized geotile data | Charged per read/write units and storage size. No cache layer means more reads/writes per request. |
| **Spoonacular API** | ~5k calls/month | Free tier or paid depending on request volume; without caching, repeated queries may increase costs. |
| **Edamam API** | ~5k calls/month | Free tier or paid depending on request volume; without caching, repeated queries may increase costs. |
| **CloudWatch** | Logs/metrics/traces from Lambda, API Gateway, DynamoDB | Charged per GB ingested and stored. PII redacted. |

---

## Monthly Cost Estimation by Usage

| Component | Cost Driver | Light (~1,000 requests/mo) | Moderate (~10,000 requests/mo) | Heavy (~100,000 requests/mo) | Notes |
|-----------|------------|---------------------------|-------------------------------|------------------------------|-------|
| API Gateway + WAF | Requests | ~$1 | ~$10 | ~$100 | Request-based pricing; rate limiting helps control spikes. |
| Lambda | Invocations & duration | ~$2 | ~$25 | ~$250 | 128 MB, 5s timeout, retries x2; repeated external API calls increase invocations slightly. |
| DynamoDB | Reads/writes & storage | ~$1 | ~$15 | ~$150 | Increased read/write usage due to lack of caching. |
| Spoonacular API | Calls | Free – $5 | $5 – $25 | $50 – $250 | No caching increases usage. |
| CloudWatch | Logs & metrics | ~$1 | ~$5 | ~$20 | Logging and metrics scale with request volume. |

**Estimated Total Monthly Cost:**  
- **Light usage:** ~$5–15  
- **Moderate usage:** ~$70–130  
- **Heavy usage:** ~$550–1,250  

---

## Cost Drivers and Considerations
1. **No MemoryDB/Redis:**  
   - Pros: Reduced fixed cache costs.  
   - Cons: More Lambda invocations and external API calls increase operational costs per request.  
2. **No CloudFront:**  
   - Pros: Simplified architecture, reduced edge configuration.  
   - Cons: Slightly higher latency for repeated requests; more load on API Gateway and Lambda.  
3. **Lambda:** Invocation costs dominate per-request expenses; retries may slightly increase costs under high failure rates.  
4. **DynamoDB:** Retention of telemetry/logs remains necessary for observability and compliance. Without caching, read/write throughput may increase.  
5. **External APIs (Spoonacular & Edamam):** Costs scale with query volume. Without caching, the system may make more repeated calls.  

---

## Cost Optimization Strategies
- **TTL and Retention Policies:** DynamoDB TTL continues to automatically delete old telemetry data, controlling storage costs.  
- **Rate Limiting / Guardrails:** API Gateway limits prevent excessive requests that could spike costs.  
- **Batching / Deduplication:** Minimize redundant API calls from concurrent Lambda invocations.  
- **Serverless Scaling:** Lambda ensures pay-per-use billing, avoiding idle server costs.  
- **Monitoring:** CloudWatch metrics help identify high-cost operations for optimization.  

---

**Notes:**  
- Monetization streams (ads, affiliate links, or optional Pro subscription) may offset operational costs but are **not included** in this cost model.  
- Costs are estimated for `ca-central-1`; running in multiple regions may proportionally increase expenses.  
- Future caching strategies (Redis, CloudFront) can be reintroduced if cost or latency becomes a bottleneck.
