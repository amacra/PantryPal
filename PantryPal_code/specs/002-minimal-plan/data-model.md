# Data Model: PantryPal Minimal Full-Stack Plan

## Entities

### User
- **Purpose**: Store minimal user info for signup/login.
- **Fields**:
  - userId (string, PK): Unique identifier.
  - emailHash (string): SHA-256 hash of email.
  - createdAt (timestamp): Creation time.
  - preferences (map): Optional user prefs (e.g., diet).
- **Relationships**: One-to-many with Sessions.
- **Validation**: emailHash required, no raw email.

### Session
- **Purpose**: Active user sessions.
- **Fields**:
  - sessionId (string, PK): Session token.
  - userId (string): FK to User.
  - createdAt (timestamp): Creation time.
  - expiresAt (timestamp): Expiration, used for TTL.
- **Relationships**: Belongs to User.
- **TTL**: expiresAt.

### RecipeCache
- **Purpose**: Cache recipe suggestions.
- **Fields**:
  - cacheKey (string, PK): Hash of request params.
  - payload (map): Cached response.
  - createdAt (timestamp): Cache time.
  - ttl (number): TTL epoch.
- **Relationships**: None.
- **TTL**: 24 hours.

### Telemetry / UserSearchHistory
- **Purpose**: Store user search history and recipe suggestions for observability and user experience.
- **Table Name**: `UserSearchHistory`
- **Fields**:
  - UserID (string, PK): User identifier (email).
  - timestamp (number, SK): Epoch milliseconds when search was performed.
  - ingredients (list of strings): Ingredients searched by user.
  - recipesPreview (list of strings): Titles of suggested recipes returned.
  - createdAt (timestamp): Record creation time.
- **Relationships**: None (denormalized for analytics).
- **TTL**: 30 days (timestamp attribute) — records automatically expire after 30 days to control storage costs.

### AuditLog
- **Purpose**: Deletion/export audit.
- **Fields**:
  - auditId (string, PK): Unique audit ID.
  - action (string): DELETE or EXPORT.
  - userIdHash (string): Hashed user ID.
  - timestamp (timestamp): Action time.
  - details (map): Audit details.
- **Relationships**: None.
- **TTL**: 1 year.