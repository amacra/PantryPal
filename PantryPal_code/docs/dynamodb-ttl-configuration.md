# DynamoDB TTL Configuration

## Overview
This document outlines the Time-To-Live (TTL) configuration for PantryPal's DynamoDB tables to manage data retention and control storage costs.

## Configured Tables

### UserSearchHistory Table

**Purpose**: Store user search history and recipe suggestions for observability and analytics.

**TTL Configuration**:
- **Enabled**: Yes
- **TTL Attribute**: `timestamp` (Number - epoch milliseconds)
- **Expiration Period**: 30 days (2,592,000 seconds)
- **Cost Impact**: Automatic deletion of records older than 30 days reduces storage costs and maintains a manageable data size

**Schema**:
- **Partition Key**: `UserID` (String) — user's email address
- **Sort Key**: `timestamp` (Number) — epoch milliseconds of search
- **Attributes**:
  - `ingredients`: List of strings (searched ingredients)
  - `recipesPreview`: List of strings (titles of suggested recipes)

**Example Record** (expires 30 days after `timestamp`):
```json
{
  "UserID": "user@example.com",
  "timestamp": 1764655823811,
  "ingredients": ["eggs", "spinach", "cheese"],
  "recipesPreview": ["Salmon Frittata", "Mini Spinach and Feta Quiches", "Portobello Baked Eggs"]
}
```

## Implementation Details

### Lambda Function
The SuggestMealsFunction (`suggest-function/index.js`) saves search history with the `timestamp` attribute set to the current epoch milliseconds:

```javascript
async function saveSearchHistory(userId, ingredients, recipes) {
  if (!userId) return;

  const now = Date.now();

  const item = {
    UserID: userId,
    timestamp: now,
    ingredients,
    recipesPreview: recipes.map((r) => r.title),
  };

  const cmd = new PutCommand({
    TableName: HISTORY_TABLE,
    Item: item,
  });

  await ddb.send(cmd);
}
```

### DynamoDB TTL Mechanism
- DynamoDB scans for expired items periodically and marks them for deletion
- Deletion is asynchronous and background; typically occurs within 48 hours
- No additional charges for TTL scanning or deletion
- Expired items may still be readable briefly after the TTL expiration time

## Cost Optimization

**Storage Cost Reduction**:
- 30-day TTL ensures only recent user history is retained
- Automatic cleanup eliminates the need for manual data pruning
- Estimated monthly storage reduction: ~30-40% compared to indefinite retention

**Related Configurations**:
- **Cost Modeling**: See `Cost and Operability/cost_modelling.md` for full cost estimates with TTL enabled
- **Monthly Estimate**: DynamoDB telemetry costs are estimated at $1–$150/month depending on usage tier

## Testing & Validation

### Local Test Files
The following test files validate system behavior related to data retention and storage:
- `tests/backPressureLocalTest.mjs` — Validates request handling under load (relevant to history record creation frequency)
- `tests/circuitBreakerLocalTest.js` — Validates API resilience (affects data consistency)
- `tests/killSwitchLocalTest.mjs` — Validates fallback behavior (ensures graceful degradation when history storage fails)

### Manual Verification
To verify TTL is enabled on the UserSearchHistory table:

1. Go to **AWS Console** → **DynamoDB** → **Tables**
2. Select **UserSearchHistory**
3. Navigate to **Manage TTL**
4. Confirm **timestamp** is set as the TTL attribute
5. Verify **TTL is enabled** status

## Monitoring & Alerts

### CloudWatch Metrics to Monitor
- `ConsumedWriteCapacityUnits`: Should remain stable as TTL deletion is free
- `UserErrors`: May spike if TTL attribute is missing from records
- `Table Item Count`: Should stabilize as old records expire

### Recommended Alerts
- Alert if `UserErrors` exceeds 5% of writes
- Alert if `Table Item Count` grows unexpectedly (indicates TTL not working)

## Documentation References
- `System Design Artifacts/API_data_schemas` — Full API and table schema documentation
- `specs/002-minimal-plan/data-model.md` — Data model specification
- `Cost and Operability/cost_modelling.md` — Cost estimates and optimization strategies

## Related AWS Documentation
- [AWS DynamoDB TTL Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)
