# PantryPal - What-Can-I-Cook Recommender

Current implementation, API contract, test commands, and SAM deployment: [docs/implementation.md](docs/implementation.md). Older deliverables below describe the original submission; current source supersedes the bundled Lambda ZIP.

Use Node.js 20+ locally. Backend source now implements signup, login, authenticated suggestions, account deletion, retention, and upstream failure controls.

## Setup

1. Clone the repo and navigate to the project.
2. Install frontend dependencies: `cd frontend && npm install`
3. Set environment variables: Copy `frontend/.env.example` to `frontend/.env` and fill in `REACT_APP_API_BASE_URL` with your API Gateway URL.

## Local Development

- Start frontend: `cd frontend && npm start` (runs on http://localhost:3000)
- Backend is deployable with AWS SAM; see the current implementation guide for configuration.

## Deployment

- Frontend: Run `./scripts/deploy-frontend.sh` (requires AWS CLI configured)
- Backend: Run `./scripts/deploy-backend.sh` to build and deploy with AWS SAM in ca-central-1.

## Environment Variables

- `REACT_APP_API_BASE_URL`: Base URL for the API Gateway (e.g., https://abc123.execute-api.ca-central-1.amazonaws.com/prod)

## Smoke Tests

Run `./scripts/test-smoke.sh` to test API endpoints with curl.

## Running Local Tests for Circuit Breakers, Back-Pressure, and Kill Switches

This section describes how to run the automated tests located in the `tests` folder for PantryPal's fail-safe mechanisms.

### Prerequisites

- Node.js >= 18 installed on your machine
- npm installed
- The `tests` folder contains:
  - `circuitBreakerLocalTest.js` (Circuit Breakers)
  - `backPressureLocalTest.mjs` (Back-Pressure)
  - `killSwitchLocalTest.js` (Kill Switches)

### Run Tests
Navigate to the `tests` folder:
   cd path/to/capstone_project/tests
Run the test files:
- node backPressureLocalTest.mjs
- node circuitBreakerLocalTest.js
- node killSwitchLocalTest.mjs

## Running Local CCT tests

navigate to the `CCT_ethics_dept/tests` folder and run
```
./run_all_tests.sh
```




## Deliverables
### [System Design Artifacts](https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/tree/fb46fb311e50774629fb1dd9352213a5e4570c1e/System%20Design%20Artifacts)
 - API/Scema Docs: https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/blob/c456c3dabe0b085d5f854bbacc4ce306357e8fec/System%20Design%20Artifacts/API_data_schemas
 - ADR: https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/blob/c456c3dabe0b085d5f854bbacc4ce306357e8fec/System%20Design%20Artifacts/adr.md
 - Architecture diagram: https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/blob/c456c3dabe0b085d5f854bbacc4ce306357e8fec/System%20Design%20Artifacts/architecture_diagram.png
 - Trust model: https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/blob/c456c3dabe0b085d5f854bbacc4ce306357e8fec/System%20Design%20Artifacts/trust_model.md

### [Clause→Control→Test + Ethics Debt](https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/tree/c456c3dabe0b085d5f854bbacc4ce306357e8fec/CCT_ethics_dept) 
- Clause control tests: https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/blob/c456c3dabe0b085d5f854bbacc4ce306357e8fec/CCT_ethics_dept/clause_control_test.md
- Telemetry matrix/ethics: https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/blob/c456c3dabe0b085d5f854bbacc4ce306357e8fec/CCT_ethics_dept/telemetry-ethics.md

### Reliability Evidence
- chaos/load test notes, idempotency plan, SLO/alert configuration, DR/runbook: https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/blob/ee3aadef79f1d06905adc15b2b5966aa797fbd3f/docs/reliability-evidence.md
- Chaos log: https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/blob/ee3aadef79f1d06905adc15b2b5966aa797fbd3f/experiments/chaos/2025-12-03-chaos.log
- Cloudwatch exceret: https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/blob/ee3aadef79f1d06905adc15b2b5966aa797fbd3f/experiments/chaos/2025-12-03-cloudwatch-excerpt.log

### [Cost and Operability](https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/tree/ee3aadef79f1d06905adc15b2b5966aa797fbd3f/Cost%20and%20Operability)

- Backpressure killswitch: https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/blob/ee3aadef79f1d06905adc15b2b5966aa797fbd3f/Cost%20and%20Operability/backpressure_killswitch.md
- Cost Modelling: https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/blob/294c41a1281e594090bf470c589cd14f1f5aa69b/Cost%20and%20Operability/cost_modelling.md
- Incidence playbook: https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/blob/294c41a1281e594090bf470c589cd14f1f5aa69b/Cost%20and%20Operability/incidence_playbook.md

### AI Collaboration Log
- https://github.students.cs.ubc.ca/CPSC436C-2025W-T1/capstone_project/blob/294c41a1281e594090bf470c589cd14f1f5aa69b/AICollaborationLog.md




