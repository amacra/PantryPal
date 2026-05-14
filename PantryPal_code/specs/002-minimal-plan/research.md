# Research Findings: PantryPal Minimal Full-Stack Plan

## Resolved Clarifications

### Lambda Runtime
**Decision**: Use Python 3.9 for Lambda functions (assuming existing functions are in Python; if Node.js, adjust accordingly).  
**Rationale**: Python is widely used for AWS Lambda, supports AWS SDK easily, and aligns with serverless best practices.  
**Alternatives considered**: Node.js (faster cold starts but more verbose for data processing), Java (better for complex logic but heavier).

### DynamoDB Schema
**Decision**: Use tables as per capstone report: RecipeCache (PK: cacheKey), Sessions (PK: sessionId), Users (PK: userId), Telemetry (PK: eventType#timestamp), AuditLogs (PK: auditId). Enable TTL on RecipeCache (24h), Sessions (7d), Telemetry (30d), AuditLogs (1y).  
**Rationale**: Matches existing architecture, ensures data retention compliance, and supports MVP needs.  
**Alternatives considered**: Single table design (simpler but harder to query), no TTL (violates retention promises).

### API Request/Response Schemas
**Decision**: 
- POST /suggestMeals: Request {pantryItems: [{name, quantity, unit}], preferences: {diet, exclude}}, Response {suggestions: [{recipeId, title, ingredientsNeeded, score}], cacheHit: bool}
- POST /signup: Request {email, password}, Response {userId, sessionToken}
- POST /login: Request {email, password}, Response {sessionToken}
- GET /health: Response {status: "ok"}
**Rationale**: Minimal schemas sufficient for MVP, extensible for future features.  
**Alternatives considered**: GraphQL (overkill for simple CRUD), more fields (keep minimal to reduce complexity).

### Frontend API Client
**Decision**: Use Axios for HTTP calls, with interceptors for auth headers and error handling. Store API base URL in environment variables.  
**Rationale**: Axios is reliable, supports interceptors for JWT, and integrates well with React.  
**Alternatives considered**: Fetch API (native but less features), React Query (adds caching, but overkill for MVP).

### CORS Handling
**Decision**: Enable CORS in API Gateway with allowed origins from environment (dev: localhost, prod: domain).  
**Rationale**: API Gateway natively supports CORS headers, simple to configure.  
**Alternatives considered**: Lambda-level CORS (more code, error-prone).

### Environment Variables
**Decision**: REACT_APP_API_BASE_URL for frontend, set to API Gateway URL. For backend, use AWS environment variables for DynamoDB table names.  
**Rationale**: Standard React env vars, secure for backend.  
**Alternatives considered**: Hardcoded URLs (not flexible), config files (harder to manage).

### Local Testing Setup
**Decision**: Use AWS SAM CLI for local Lambda testing, with DynamoDB Local for storage. For frontend, use npm start with proxy to local SAM API.  
**Rationale**: SAM provides realistic local environment, DynamoDB Local avoids AWS costs.  
**Alternatives considered**: Mock API with MSW (faster but less realistic), full AWS deploy for testing (expensive).

### Deployment
**Decision**: Frontend: npm run build → upload to S3 + CloudFront. Backend: Already deployed, use AWS CLI or Terraform for updates if needed.  
**Rationale**: Standard React deploy, backend assumed stable.  
**Alternatives considered**: Vercel/Netlify (easier but vendor lock-in), manual Lambda updates (error-prone).