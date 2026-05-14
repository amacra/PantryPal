# Quickstart: PantryPal Minimal Full-Stack Plan

## Setup

1. Clone repo and checkout branch: `git checkout 002-minimal-plan`
2. Install frontend deps: `cd frontend && npm install`
3. Configure environment: Copy `config/dev.env` to `.env` in frontend/, set `REACT_APP_API_BASE_URL=https://your-api-gateway-url`

## Local Run

- Frontend: `cd frontend && npm start` (runs on http://localhost:3000)
- Backend: Use AWS SAM for local testing if needed: `sam local start-api`

## Environment Variables

- `REACT_APP_API_BASE_URL`: API Gateway URL (e.g., https://abc123.execute-api.ca-central-1.amazonaws.com/prod)

## Build/Deploy

- Frontend: `npm run build` → upload `build/` to S3/CloudFront
- Backend: Already deployed; update via AWS Console or Terraform if changes needed

## Sample Data

Pantry: [{"name": "chicken", "quantity": 2, "unit": "lbs"}, {"name": "rice", "quantity": 1, "unit": "cup"}]

## Smoke Tests

- Health: `curl https://api-url/health`
- Signup: `curl -X POST https://api-url/signup -d '{"email":"test@example.com","password":"pass"}'`
- Login: `curl -X POST https://api-url/login -d '{"email":"test@example.com","password":"pass"}'`
- Suggest: `curl -X POST https://api-url/suggestMeals -d '{"pantryItems":[{"name":"chicken"}]}'`