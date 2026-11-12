# DynamoDB retention

The current Lambda writes `expiresAt = floor(Date.now() / 1000) + 2592000` on every search-history item. The SAM template enables TTL on **expiresAt**. The `timestamp` sort key remains in milliseconds and must not be used as the TTL attribute.

DynamoDB expires items asynchronously. TTL is not a strict 30-day erasure deadline or a 10-item history cap. Account deletion explicitly removes every history item without waiting for TTL. Existing history rows without `expiresAt` require a separate migration; enabling TTL alone does not update old rows.

See [implementation.md](implementation.md) for runtime behavior, testing, and deployment.
