# PantryPal Minimal Full-Stack Plan Spec

## Context  
- Frontend: React SPA, already bootstrapped with Create React App  
- Backend: AWS serverless stack (Lambda + DynamoDB) — already deployed on AWS  
- No in-memory cache (no MemoryDB/Redis); use DynamoDB only  

Existing backend Lambda functions (do not recreate):  
- PantryPalHello  
- SignUpFunction  
- LoginFunction  
- SuggestMealsFunction  

## Goal for this plan  
Generate a **minimal full-stack plan** (in Markdown) sufficient to deliver a working MVP: React frontend served locally or statically + backend API on AWS, such that the frontend can call the backend Lambda via HTTP and DynamoDB works as the data store.  

Do **not** add optional cache layers or production-hardening steps beyond what’s strictly needed for MVP local run + AWS deployment.  

## What to include in the plan  

- **Frontend-backend wiring**: Configure how the React app should call the backend — environment variable or config (API base URL), CORS handling, basic error/loading UI.  
- **API Gateway & Lambda integration**: Map HTTP endpoints to the existing Lambda functions (`/signup`, `/login`, `/suggestMeals`, etc.), specify methods, request/response schemas.  
- **DynamoDB usage**: Show table(s) already used (or to be used) for user/session/submission data, minimal schema if needed.  
- **Simple deployment/run instructions**: Local running of React (via `npm start`), how to point to a real or local backend, how to configure environment variables, and how to deploy backend (if not yet).  
- **Basic dev/test setup**: Suggest minimal local testing setup (e.g. local HTTP proxy to API, or rely on AWS staging), error handling, basic validation.  
- **Folder/project structure suggestion**: Where to put config, where frontend lives vs backend, separation of client and server code.  
- **MVP scope definition**: Mark what’s included now vs what’s deferred — e.g. caching, rate-limiting, staging vs prod, CI/CD, security hardening.