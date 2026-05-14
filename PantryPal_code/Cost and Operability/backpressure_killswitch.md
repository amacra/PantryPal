# PantryPal – Back-Pressure, Kill Switches & Circuit Breakers

## Overview
PantryPal uses fail-safe mechanisms to maintain reliability, control operational costs, and prevent cascading failures. These mechanisms include:

- **Circuit Breakers:** Prevent repeated failed calls to external APIs.  
- **Back-Pressure:** Prevent system overload during traffic spikes.  
- **Kill Switches:** Allow rapid shutdown of high-cost operations.  
- **Monitoring & Observability:** Track system health and trigger alerts.

This document describes the design, implementation, and operational behavior of these mechanisms.

---

## 1. Circuit Breakers

**Design:**  
Prevent repeated external API calls when failures occur, reducing cost and avoiding degraded UX.

**Implementation Details:**
- Implemented in `SuggestMealsFunction` using **Node.js `opossum` library**.
- Configured with:
  - **Timeout:** 5 seconds per external API call.
  - **Error threshold:** 20% failed calls trigger the circuit to open.
  - **Reset cooldown:** 60 seconds before trial requests resume normal operation.
- **Fallback behavior:** Return cached or empty results with `stale: true` flag while circuit is open.

**Operational Behavior:**
- Tracks API failures per Lambda invocation.  
- Opens circuit to prevent further external API calls when failure threshold exceeded.  
- Resets automatically after cooldown with trial requests to external API.  

**Testing / Verification:**
- Local `circuitBreakerLocalTest.js` simulate failures and confirm fallback responses.  

---

## 2. Back-Pressure

**Design:**  
Prevent excessive traffic from overwhelming Lambda, API Gateway, or DynamoDB.

**Implementation Details:**
- **API Gateway throttling:** Set **Rate limit** (RPS) and **Burst limit** per client for each route.
- **Lambda concurrency limits:** Controlled using **ReservedConcurrentExecutions** to cap simultaneous executions.
- **Optional buffering:** SQS can queue requests and smooth bursts (not currently used, optional future enhancement).
- **Metrics monitored:** 
  - API Gateway 429 ThrottleCount  
  - Lambda Throttles and Errors  
  - SQS queue depth if enabled

**Operational Behavior:**
- Requests exceeding rate/concurrency limits receive HTTP 429 responses or are delayed by SQS.  
- Ensures system stability during traffic spikes without crashing downstream services.

**Testing / Verification:**
- Local tests (`backPressureLocalTest.mjs`) simulate high request rates and confirm:
  - Lambda does not exceed reserved concurrency.
  - API Gateway returns 429 when limits exceeded.
  - No data loss occurs during spikes.

**Clause-Control Test Example:**
| Clause | Control (Enforcement Points) | Test (Red Bar) |
|--------|-----------------------------|----------------|
| API request rate should not overwhelm the service and API failures should be handled gracefully under high load | API Gateway + Lambda ReservedConcurrentExecutions | `backPressureLocalTest.mjs` simulates bursts, monitors Lambda throttling and API 429s |

---

## 3. Kill Switches

**Design:**  
Provide rapid shutdown capability to prevent runaway costs or cascading failures.

**Implementation Details:**
- **Manual kill switch:** Controlled via Lambda environment variable `CALL_EXTERNAL_API=true/false`.
- **Automatic kill switch:** Triggered by **CloudWatch alarms** on:
  - High Lambda error rates
  - High RPS exceeding safe thresholds
- **Notifications:** SNS alerts sent to operations team when kill switch activates.

**Operational Behavior:**
- Disables high-cost external API calls when active.  
- Returns safe fallback results (e.g., empty recipes with `stale: true`) while active.  
- Allows operators to safely investigate without degrading other system functionality.

**Testing / Verification:**
- Local tests simulate both manual and automatic kill switch activation.  
- Clause-Control Test Example:
  - **Clause:** External API calls must be bypassed when kill switch is active.  
  - **Control:** Lambda `CALL_EXTERNAL_API` environment variable + CloudWatch alarms  
  - **Test:** `killSwitchLocalTest.js` ensures no external API requests are made and `stale: true` is returned.

---

## 4. Monitoring & Observability

**Metrics Tracked:**
- API Gateway:
  - `5XXError`, `4XXError`, `ThrottleCount`, `Latency`
- Lambda:
  - `Duration`, `Errors`, `Throttles`, `ConcurrentExecutions`

**Alarms & Alerts:**
- Circuit breaker activation → CloudWatch alarm → SNS notification
- Kill switch triggered → CloudWatch alarm → SNS notification
- Back-pressure / throttling → CloudWatch alarm → SNS notification


---

## 5. Notes

- These mechanisms are **fully implemented in AWS Lambda and API Gateway**; local tests are used to validate behavior before deployment.  
- Clause-Control Tests document expected behavior and provide auditability for reliability and compliance purposes.
