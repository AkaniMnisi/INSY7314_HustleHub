# Akani contribution — merging safely and committing with GitHub Desktop

The full project archive is already merged. The backend-only archive contains the same updated backend source, so **do not copy both archives on top of each other**. Pick either the full-project archive or, if teammates already have the full repo, copy the `backend/` directory from the backend-only archive into that repo.

## Files changed for Akani's work

- `backend/routes/auth.js`, `models/User.js`, `middleware/validation.js`, `utils/lockout.js`: login lockout, password strength, rotating HttpOnly refresh cookie with SHA-256 digest and logout.
- `backend/utils/logger.js`, `middleware/requestLogger.js`, `app.js`, `controllers/bookingController.js`: Better Stack logging, request ID and protected error responses.
- `backend/utils/tax.js`, `controllers/incomeController.js`, `controllers/bookingController.js`: SARS 2026/27 tax estimation, per-booking estimate and income API totals.
- `backend/seedAdmin.js`, `Dockerfile`, `.dockerignore`, `.env.example`: secure admin seed, container and environment setup.
- `backend/tests/*`, `backend/jest.config.js`, `backend/package*.json`: tests/dependencies.
- **Only compatibility changes on frontend:** `frontend/src/api/axios.js` and `frontend/src/context/AuthContext.jsx` for cookie refresh/logout. No styling, page design, dashboard charts or gig views have been altered.

## Commit sequence (all should reflect actual individual work)

Use a fresh feature branch, e.g. `feature/akani-tax-security-logging`, then review the exact changed files before committing. Useful grouping for real work:

1. `fix(api): restore missing request logger and error-handler integration`
2. `feat(tax): add SARS progressive tax utility and unit tests`
3. `feat(income): recalculate tax dashboard summary and monthly breakdown`
4. `feat(logging): ship structured auth booking and transaction events to Better Stack`
5. `feat(security): persist login lockout and stronger password checks`
6. `feat(auth): rotate hashed refresh tokens in HttpOnly cookies`
7. `fix(frontend): support refresh cookies without changing page layouts`
8. `test(auth): cover cookie refresh replay and income calculations`
9. `docs(security): add final threat-to-protection mapping and deployment guide`

Do not create fake commits or change author attribution; make commits for work actually reviewed and owned. Never add `backend/.env`, `node_modules`, database exports, log tokens or deployment credentials.

## Handoff before merge

- In local backend: `npm ci`, `npm run test:unit`, then `npm test` against a disposable MongoDB. Confirm the printed failures/skips.
- In frontend: `npm ci`, `npm test`, `npm run build`.
- Configure logging and capture Better Stack `Live tail` screenshot with no secrets.
- Confirm `GET /api/health`, register/login/logout and booking flow.
- Submit Akani's PR to the integration branch and ask Sibusiso to run Compose, CodeQL, npm audit and pipeline health tests. Blake can then build charts from `monthly` fields.
