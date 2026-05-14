# Reliability Evidence

## Uptime Budget & Dependency Tree
| Component | Provider | Individual SLO | Contribution | Mitigation | Cost to Harden |
|-----------|----------|----------------|--------------|------------|----------------|
| Spoonacular API | 3rd-party | 99.5% (est.) | Dominant external risk; dictates blended SLO when used synchronously | Circuit breaker + fallback empty response; kill switch (`CALL_EXTERNAL_API=false`) | Low (code/config) |
| API Gateway | AWS | 99.95% | Front door; mostly stable vs. external failures | Regional deployment | Low (config) |
| Lambda (SuggestMeals) | AWS | 99.95% | Executes breaker/fallback logic | Provisioned concurrency; retry-safe code paths | Low (config) |

- Target SLO: 99.9%
- Combined uptime (serial, dominated by Spoonacular): 0.9995×0.9995×0.995 ≈ **99.40%**
- Downtime budget at 99.9%: ~43.8 min/month. Without fallback, external outages could consume ~259 min/month; must rely on circuit breaker + fallback to stay within budget during external incidents.
- External API incident classes: P0 ≤10 min (5xx/timeout spike), P1 10–25 min (sustained fallback/empty recipes), P2 25–43 min (prolonged fallback; watch error budget).

## Chaos Experiment Summary
Expected outcomes:
- Failover time: breaker opens on first failing request; subsequent calls return fallback within p95 <400 ms (target 250 ms).
- Alerts: Spoonacular timeout/error ratio breaches ≥10% for 5m; breaker OPEN >60s; p95 latency ≥400 ms for 5m.
- Monetization impact: empty recipe lists reduce conversions but avoid 5xx session loss; acceptable during external outage.


| Date | Fault Injected | Hypothesis | Observed | Follow-up |
|------|----------------|-----------|----------|-----------|
| 2025-12-03 | Spoonacular 100% fail via `CHAOS_FAIL_EXTERNAL=true` | Circuit breaker trips; fallback returns empty recipes; latency <5s; history write still logs | 200 responses with `recipes: []`; breaker opened after first error; p95 1.2s; CloudWatch log `Chaos mode: mocking Spoonacular failure` | Add synthetic canary to assert fallback freshness; product to confirm empty-state copy |

Evidence artifacts:
- Client-facing response log: `chaos/2025-12-03-chaos.log`.
- CloudWatch excerpt showing breaker trigger/timing: `chaos/2025-12-03-cloudwatch-excerpt.log`.


## Premium Incident Runbook Snippet
- Trigger: External API timeout/error ratio ≥10% for 5m, p95 latency ≥400 ms for 5m (target p95 250 ms), or circuit breaker OPEN >60s.
- Roles: Incident Commander (IC), Comms Lead, Ops (Lambda/API Gateway), 3rd-Party Liaison.
- Steps (numbered):
  1) IC opens bridge; post to `#incidents` with ID.
  2) Ops flips `CALL_EXTERNAL_API=false` and/or `CHAOS_FAIL_EXTERNAL=true` to force fallback; confirm 200 with `recipes: []`.
  3) Verify breaker metrics/logs show failures contained; ensure no retry storm.
  4) IC gathers last 15m API GW/Lambda metrics and Spoonacular timeout/error ratio; note customer impact (empty recs).
  5) Comms Lead sends update: “Third-party recipe provider degraded; serving empty recommendations while we mitigate. Next update in 30 minutes.”
  6) Run red-bar test: replay `experiments/chaos/2025-12-03-chaos.log` in staging; ensure fallback p95 <400 ms and attribution intact.
  7) Exit when external recovers and fallback removed; publish postmortem within 24h.

## Idempotency & Replay Handling (`/suggest`)
- Treat each request as idempotent by hashing `{UserID, sorted ingredients}` into a request key; cache responses under that key (TTL ≤6h).
- Deduplicate concurrent requests by locking on the key (single in-flight fetch); losers read the cached result.
- Ignore duplicate history writes by using idempotency key as DynamoDB PK/SK or conditional put with `attribute_not_exists`; fallback to best-effort write if history is optional.
- Safe retries: handler tolerates replays by returning cached result or recomputing without double-charging external API more than the circuit breaker allows.

## Metrics & Alert Plan
| Metric | Threshold | Collection | Alert Destination | Monetization Tie |
|--------|-----------|------------|-------------------|------------------|
| Spoonacular timeout/error ratio | ≥10% for 5m | Custom metric from breaker events + CW logs | PagerDuty (SEV1) + Slack `#reliability` | Empty recs reduce conversions |
| p95 latency (API GW) | Target 250 ms; alert ≥400 ms for 5m | CloudWatch percentiles | PagerDuty (SEV2) | Slow responses drop engagement |
| 5xx rate (API GW/Lambda) | Target <0.5%; alert ≥5% for 2m | CloudWatch errors | Slack `#incidents` | Lost sessions/orders |
| Circuit breaker state | OPEN >60s | Custom metric from breaker | PagerDuty (SEV2) | Prolonged fallback hurts engagement |
| Error budget burn | >2%/60m | CloudWatch math metric | PagerDuty (SEV1) | Protects 99.9% uptime target |

## Disaster Recovery (DR)
- RPO/RTO targets: RPO ≤15m (telemetry/history tolerance), RTO ≤30m for regional issues.
- Backups: DynamoDB PITR enabled; daily export to S3 for history; IaC (SAM/CDK/Terraform) as source of truth.
- Region strategy: primary `ca-central-1` with deployable standby in a second region; API Gateway + Lambda redeploy via CI; DNS failover toggled manually after verification.
- Cache: MemoryDB/Redis treated as non-durable; rebuilt from DynamoDB/export on failover.
- DR test: annual tabletop + semi-annual redeploy to standby to validate RPO/RTO.
