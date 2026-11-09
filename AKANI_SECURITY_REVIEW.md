# Final security review — Akani's scope (INSY7314 Part 3)

**Review date:** 9 November 2026. **System:** HustleHub+ MERN API. **Scope:** supplied code and integrated patch only. This is a manual source review, not a penetration test or claim of external certification.

| Threat | Where relevant | Mitigation in this package | Verification / residual risk |
|---|---|---|---|
| Password guessing / credential stuffing | `/api/auth/login` | Per-IP `authLimiter`, persistent per-account `failedLoginAttempts` and `lockUntil` (5 failures, 15 minutes), bcrypt password hashes | `lockout.test.js`, `lockout.int.test.js`. Distributed attackers can intentionally lock users; use abuse monitoring, challenge/step-up auth in production. Concurrent attempts may race between reads/updates. |
| Stolen or replayed refresh token | `/api/auth/refresh` | Random JWT `jti`, HttpOnly/SameSite cookie, SHA-256 token digest in MongoDB, atomic hash compare-and-rotate, endpoint requires custom header | `refresh.test.js`. Only one active refresh session per account. Prior access tokens remain valid up to their 1-hour expiry even after logout. |
| CSRF on cookie mutations | `/refresh` and `/logout` | SameSite cookie, exact-origin credentialed CORS and required `X-Requested-With` header (triggers browser preflight) | `refresh.test.js`. Review deployment allowed origins; Lax assumes same-site frontend. CORS alone is not a comprehensive CSRF defense. |
| NoSQL injection | Inputs to auth, gig and booking endpoints | `express-validator` rejects malformed values; `express-mongo-sanitize` removes MongoDB operator keys from JSON body/params | `security.test.js`. Query strings and any newly added database operations must continue to be reviewed. |
| XSS and browser token theft | Browser views/auth | React escapes interpolated text; Helmet supplies CSP; refresh session cannot be read by JS | `security.test.js` checks headers. Access token remains in `localStorage` for frontend compatibility, so XSS could still expose it; storing access tokens in memory is a further hardening task. |
| Unauthorized access / IDOR | `/api/gigs`, `/api/bookings`, `/api/income`, `/api/admin` | JWT validation loads current user role; role guards; booking list filters by authenticated principal; users cannot self-book | `security.test.js`, original role route handlers. Audit every new route for ownership checks. |
| Cross-origin access | API and React frontend | `cors` allowlist from `FRONTEND_URL`, `credentials: true` and rejection of unlisted origins | `security.test.js`. Restrict production origins, no wildcard. |
| Sensitive log disclosure | Auth/transactions/errors | Winston logs event metadata rather than passwords; recursive redaction of secret-field keys; masked email used for failed login; request paths exclude queries | Manual review + live Better Stack confirmation required; never send passwords, raw tokens, cookies or `.env` values to cloud. IP/user IDs are still personal metadata: use retention/access controls. |
| Financial misstatement | Booking and income | Server-side gig price; SARS marginal calculation and primary rebate, historical 15% tax recalculated on dashboard; fake payment only | `tax.test.js`, `income.test.js`. Does not account for deductions, other income, age, tax credits or concurrency. No real payments are processed. |
| Container privilege and secret leakage | Docker image | Node non-root runtime, `.dockerignore` excludes `.env` and dependencies; env values passed at runtime | Inspect image and execute `docker build` + health check on developer machine. Never bake secrets into image. |
| Exposed default administrator credentials | `seedAdmin.js` | Must set `ADMIN_EMAIL` and `ADMIN_PASSWORD` via environment; password never printed | Manual review; enforce provisioning policies and rotate any old shared demo credentials. |
| Error detail leak | API errors | Sanitized HTTP 500 response in production, central logger, no stack in JSON response | `security.test.js`; review logs for sensitive data and unusual exceptions. |

## Evidence not yet verified

- **Cloud logging is implemented but not verified** until an actual Better Stack source is configured and a real `Live tail` screenshot shows events.
- **Full MongoDB integration**, **npm audit**, **CodeQL**, **Docker build/run**, and **GitHub Actions** require the relevant services and dependencies. Do not mark them complete without results.
- Frontend tax charts and two-container Compose/CI are team responsibilities outside Akani's backend contribution.

## Remediation priorities

1. Fix any findings from CodeQL/npm audit and re-run until successful; document each finding and change in the team README.
2. Replace in-memory/IP rate-limit stores with shared storage when scaling to several API containers.
3. Use a database transaction or serialized ledger to guarantee correctness for simultaneous bookings and prevent duplicate booking requests.
4. Add multi-device refresh-session support or clearly document the single-session policy. Consider shorter access token TTL and logout revocation for production.
5. Extend tax calculations to the SARS tax year after 2026/27, and consider expenses/credits if moving beyond the assessment's simplified simulation.

## Sources consulted

South African Revenue Service (SARS). 2026. *Rates of tax for individuals – 2027 tax year*. Available at: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/ (Accessed: 9 November 2026).

Better Stack. n.d. *Winston transport*. Available at: https://betterstack.com/docs/logs/javascript/winston/ (Accessed: 9 November 2026).
