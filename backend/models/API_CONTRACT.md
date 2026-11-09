# HustleHub backend API (Part 3 Akani)

Base URL: `http://localhost:5000/api`

- `POST /auth/register` (body `{name,email,password,role}`) → `201 {token,user}` plus `Set-Cookie: hh_refresh=...; HttpOnly; SameSite=Lax`
- `POST /auth/login` (body `{email,password}`) → `200 {token,user}` plus same cookie. After 5 wrong passwords, the account is locked for 15 minutes (423).
- `POST /auth/refresh` (cookie and `X-Requested-With: XMLHttpRequest`) → `200 {token}` plus a new cookie, rotating the old session.
- `POST /auth/logout` (cookie and `X-Requested-With: XMLHttpRequest`) → `200 {message}` and clears cookie.
- `GET /gigs`, `/gigs/mine`, `/gigs/:id`; `POST /gigs`, `PUT /gigs/:id`, `DELETE /gigs/:id` (existing endpoints unchanged).
- `POST /bookings` (client only, body `{gigId}`) → `201 {booking, transaction}`; `GET /bookings` (role-filtered authenticated list).
- `GET /income`, `GET /freelancers/income` (freelancer only) → `{taxYear,totalIncome,taxOwed,totalTax,netIncome,taxRate,marginalRate,primaryRebate,taxFreeThreshold,transactionCount,monthly,breakdown}`.
- `GET /admin/users`, `GET /admin/transactions`, `PUT /admin/users/:id/suspend` (admin only).
- `GET /health` → `{status:"ok",...}`.

No raw refresh token is returned in any JSON body. The `token` field is the existing one-hour Bearer access token; the stored refresh cookie is seven days. Existing frontend flows use the access token with `Authorization: Bearer ...`.
