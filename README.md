# HustleHub+ — INSY7314 Part 3 (Akani backend integrated)

This copy combines the supplied HustleHub full project with the supplied Akani backend patch. The existing React pages, gig routes, booking response and login response fields are preserved. The only frontend code changed is the authentication API client/session logout logic required by cookie-based refresh tokens.

**Important:** No production database, Better Stack account or cloud secrets are bundled. You must supply them, run the full test suite and capture your own live evidence before submission. Docker Compose, end-to-end CI, CodeQL, frontend charts and the demonstration video are other team members' responsibilities; this package does not claim those tasks are finished.

## What Akani implemented

- SARS 2026/27 progressive income-tax estimate (`backend/utils/tax.js`) with bracket/threshold tests; old 15% transaction amounts are re-estimated in income dashboard responses.
- Tax estimated incrementally when creating a simulated booking; `GET /api/income` and `GET /api/freelancers/income` retain `totalIncome`, `taxOwed`, `taxRate`, `netIncome`, `breakdown`, and add `monthly`, `taxYear`, `marginalRate`, `totalTax`.
- Winston console logging and optional Better Stack transport; structured, correlation-ID request logs plus login, registration, booking, transaction and error events.
- Extra security: persisted 5-attempt/15-minute account lockout; hashed, rotating HttpOnly refresh cookie; stricter registration password checks. Existing baseline rate limits, Helmet, input validation, role checks and CORS remain.
- Backend non-root Dockerfile and `.dockerignore`; environment-only admin seeding.
- Unit/security tests, mocked refresh/summary checks, final security review and merge checklist.

## Run locally with Windows PowerShell

Prerequisites: **Node.js 22 LTS or later**, **MongoDB** (local or Atlas), **npm** and two terminals. Docker is only needed for container evidence.

1. In `backend`, copy `.env.example` to `.env` and set `MONGO_URI`, a random `JWT_SECRET` (32+ characters), and a *different* random `JWT_REFRESH_SECRET`. Keep `NODE_ENV=development`, `REFRESH_COOKIE_SAMESITE=lax` and `FRONTEND_URL=http://localhost:5173` for local use. **Do not commit `.env`.**
2. In terminal 1:
   ```powershell
   cd backend
   npm ci
   npm start
   ```
   Visit http://localhost:5000/api/health and verify the JSON status is `ok`. MongoDB must be running first.
3. In terminal 2:
   ```powershell
   cd frontend
   npm ci
   npm run dev
   ```
   Open http://localhost:5173 and register/login. The browser saves the **access token** in local storage for compatibility; the refresh session resides in an **HttpOnly cookie**.
4. To run backend tests without a database: `cd backend; npm run test:unit`. To run the complete suite, set `MONGO_URI` to a **disposable test database** and run `npm test`. Do **not** run integration tests against production data.
5. Frontend verification: `cd frontend; npm test; npm run build`.
6. Dependency and static analysis checks (require internet/GitHub setup): in each project run `npm audit --audit-level=high`. Sibusiso's CI should run CodeQL and record all findings and fixes.

## Cloud logging setup (Better Stack)

Create a JavaScript/Node.js log source in Better Stack and put its **source token** and **ingesting host** (hostname only, without `https://`) in backend `.env`:

```text
LOGTAIL_SOURCE_TOKEN=<your real token>
LOGTAIL_INGESTING_HOST=<your real ingest host>
```

Restart the API, make a successful/failed login and test booking, then open **Better Stack → Live tail** to confirm the event names such as `auth.login.success`, `auth.login.failed`, `booking.created`, `transaction.recorded`, `http_request`. If both values are empty, only console logging is active and **cloud logging rubric evidence is not yet satisfied**. Never screenshot or commit live secrets. Better Stack instructions: https://betterstack.com/docs/logs/javascript/winston/.

## SARS tax calculation and assumptions

For the **2027 tax year (1 March 2026 to 28 February 2027)** the code uses SARS' 2026/27 progressive individual brackets, with the **R17,820 primary rebate** for a person under 65. The app models a freelancer's *platform income as if it were all taxable income* and assumes no deductions, other earnings or additional rebates.

- Calculate the gross tax from the appropriate bracket: `base tax + rate × (annual taxable income − bracket start)`.
- Estimated annual tax = `max(0, gross tax − R17,820)`.
- Estimated tax from one additional booking = `annualTax(previous platform income + booking amount) − annualTax(previous platform income)`.
- Example: R200,000 annual gross platform income → `(R200,000 × 18%) − R17,820 = R18,180` estimated tax; net = R181,820. The effective rate shown in the dashboard is `R18,180/R200,000 = 9.09%`, **not a flat statutory tax rate**.

The income dashboard recalculates cumulative estimates in chronological order so that older 15% saved values do not corrupt the summary. Per-transaction stored estimates may temporarily differ when concurrent bookings occur; the dashboard is the current estimated source of truth. This is **not an actual tax filing or tax advice**. Update the tax table when the SARS assessment year changes; the current utility is pinned to 2026/27.

Official SARS source: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/ (2027 tax year).

## Auth API compatibility

- `POST /api/auth/register` and `POST /api/auth/login`: JSON **`{token, user}`** and `Set-Cookie: hh_refresh=...; HttpOnly; SameSite=Lax`. Refresh token is **never** in JSON.
- `POST /api/auth/refresh`: send the cookie with `withCredentials` and header `X-Requested-With: XMLHttpRequest`; returns JSON `{token}` and rotates cookie.
- `POST /api/auth/logout`: send the same header and cookie; revokes the current refresh session and clears it.
- Existing Bearer access tokens and `/api/bookings`, `/api/gigs` API remain available. Login again after updating if a previous session used the old body-supplied refresh token.
- For different-site frontend/API domains in production, HTTPS is mandatory and `REFRESH_COOKIE_SAMESITE=none` may be needed; configure exact allowed `FRONTEND_URL` origins and trusted proxy settings. Do not use `*` for credentialed CORS.

## Docker (Akani's API image)

```powershell
cd backend
docker build -t hustlehub-api:part3 .
docker run --rm -p 5000:5000 --env-file .env hustlehub-api:part3
```

When MongoDB runs on the Windows host, replace `localhost` inside container database URI with `host.docker.internal`; an Atlas URI works if network access is allowed. `docker-compose.yml` and two-container Compose verification belong to Sibusiso's integration work.

## Evidence and handoff

Read `AKANI_SECURITY_REVIEW.md` for concrete threat/mitigation mapping, test coverage and outstanding risks. Read `AKANI_MERGE_GUIDE.md` for file ownership and safe GitHub Desktop commits. Submission evidence still required from a real run: backend test results, Docker container image and health response, Better Stack Live tail, tax endpoint calculations, and the team CI / CodeQL / Compose evidence.
