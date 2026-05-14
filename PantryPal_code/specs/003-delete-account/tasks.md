# Tasks: Delete Account from Suggest Meals

## Implementation Strategy
MVP-first: Implement a simple, reliable delete-account flow triggered from the Suggest Meals page that calls the existing `/deleteData` Lambda-backed API, logs the user out, and redirects to the Landing page. Then add clear confirmation copy and basic error handling.

## Dependencies
- Depends on existing auth/session handling (Login, Signup, `AuthContext`) and Suggest Meals page being functional.
- `/deleteData` backend endpoint must be deployed and accessible from the frontend.

## Parallel Execution Examples
- While wiring the delete UI into `SuggestMeals.jsx`, copy/confirmation text and Landing-page banner can be refined in parallel.
- Error-handling tweaks in `Login.jsx` are independent of the main delete flow and can be done in parallel once backend error shape is known.

## Phase 1: Setup
- [ ] T001 Confirm `/deleteData` API behavior and CORS using curl from scripts/test-smoke.sh or manual commands

## Phase 2: Foundational
- [ ] T002 Ensure AuthContext and routing are ready to support logout and redirect after deletion in frontend/src/context/AuthContext.jsx and frontend/src/App.js

## Phase 3: User Story 1 - Delete my account from suggestions (P1)
- [ ] T003 [US1] Import and use AuthContext in frontend/src/pages/SuggestMeals.jsx to access isAuthenticated and logout
- [ ] T004 [P] [US1] Add delete-account UI entry point (button or link) on Suggest Meals page in frontend/src/pages/SuggestMeals.jsx, visible only when authenticated
- [ ] T005 [P] [US1] Implement local UI state for delete confirmation (show/hide, loading, error) in frontend/src/pages/SuggestMeals.jsx
- [ ] T006 [US1] Implement handleDeleteAccount in frontend/src/pages/SuggestMeals.jsx to call api.post('/deleteData'), handle loading/error, and invoke logout on success
- [ ] T007 [US1] On successful delete, redirect user from SuggestMeals to Landing page ('/') using useNavigate in frontend/src/pages/SuggestMeals.jsx

## Phase 4: User Story 2 - Data deletion confirmation details (P2)
- [ ] T008 [US2] Add confirmation copy explaining what data is deleted and that the action is permanent in the delete confirmation UI in frontend/src/pages/SuggestMeals.jsx
- [ ] T009 [P] [US2] Adjust delete/confirm/cancel button styles to be clearly distinguishable from normal navigation in frontend/src/pages/SuggestMeals.jsx
- [ ] T010 [US2] Optionally display a one-time confirmation message on Landing page after redirect (e.g., using location state) in frontend/src/pages/Landing.jsx

## Phase 5: User Story 3 - Error handling for failed deletion (P3)
- [ ] T011 [US3] Surface backend delete errors from /deleteData in the Suggest Meals delete confirmation UI using ErrorMessage or inline text in frontend/src/pages/SuggestMeals.jsx
- [ ] T012 [P] [US3] Coordinate or document the backend error shape for deleted accounts on login attempts (e.g., error code) for reference in Login handling
- [ ] T013 [US3] Update Login error handling to show a specific message when a deleted account attempts to log in in frontend/src/pages/Login.jsx

## Phase 6: Polish & Cross-Cutting Concerns
- [ ] T014 Review copy for delete-account and confirmation messages to ensure clarity and alignment with spec across frontend/src/pages/SuggestMeals.jsx and frontend/src/pages/Landing.jsx
- [ ] T015 Manually validate end-to-end flows (happy path, failure path, post-deletion login attempts) using the browser and Network tab
