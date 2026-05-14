# Tasks: PantryPal Minimal Full-Stack Plan

## Implementation Strategy
MVP-first: Start with foundational API wiring and basic UI, then add signup/login, then suggestMeals. Parallelize UI components where possible. Use DynamoDB-only as per plan.

## Dependencies
- US1 (Signup/Login) must complete before US2 (Suggest Meals) for auth context.
- Foundational tasks block all user stories.
- Setup tasks are prerequisites.

## Parallel Execution Examples
- After Foundational: Run T005 [P] and T006 [P] in parallel for API client setup.
- Within US1: T010 [P] and T011 [P] for login/signup components.
- Within US2: T015 [P] and T016 [P] for suggest UI.

## Phase 1: Setup
- [X] T001 Create config directory structure in config/ with dev.env, staging.env, prod.env
- [X] T002 Create scripts directory with deploy-frontend.sh and deploy-backend.sh stubs
- [X] T003 Update frontend/package.json to include axios dependency for API calls
- [X] T004 Set up environment variables template in frontend/.env.example with REACT_APP_API_BASE_URL

## Phase 2: Foundational
- [X] T005 Create API client service in frontend/src/services/api.js with axios instance and base URL from env
- [X] T006 Add error handling interceptor in frontend/src/services/api.js for 401/500 responses
- [X] T007 Create config module in frontend/src/config/index.js to export API base URL
- [X] T008 Add basic loading/error UI components in frontend/src/components/ (LoadingSpinner.jsx, ErrorMessage.jsx)

## Phase 3: User Story 1 - Signup and Login
- [X] T009 Create Signup page component in frontend/src/pages/Signup.jsx with form fields (email, password)
- [X] T010 [P] Create Login page component in frontend/src/pages/Login.jsx with form fields (email, password)
- [X] T011 [P] Wire Signup component to POST /signup API in frontend/src/pages/Signup.jsx, handle response/session storage
- [X] T012 Wire Login component to POST /login API in frontend/src/pages/Login.jsx, handle response/session storage
- [X] T013 Add auth context in frontend/src/context/AuthContext.jsx for session management
- [X] T014 Update App.js to include routing for Signup/Login pages and auth guard

## Phase 4: User Story 2 - Suggest Meals
- [X] T015 Create SuggestMeals page component in frontend/src/pages/SuggestMeals.jsx with pantry input form
- [X] T016 [P] Wire SuggestMeals to POST /suggestMeals API in frontend/src/pages/SuggestMeals.jsx, display suggestions
- [X] T017 Add recipe display component in frontend/src/components/RecipeCard.jsx for suggestion items
- [X] T018 Integrate auth context in SuggestMeals for authenticated requests

## Phase 5: Polish & Cross-Cutting Concerns
- [X] T019 Add health check endpoint integration in frontend/src/services/api.js for GET /health
- [X] T020 Implement CORS handling notes in API Gateway (assumed deployed)
- [X] T021 Create smoke test script in scripts/test-smoke.sh using curl commands from quickstart
- [X] T022 Update README.md with deployment instructions and environment setup