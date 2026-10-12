# HustleHub — INSY7314 POE Part 2

HustleHub is a MERN freelance-services marketplace. Clients browse and book gigs; freelancers publish listings and review booking activity and simulated income/tax summaries. The assessment implementation does not process real payments.

## Features
- Register and log in with JWT access tokens and rotating refresh tokens.
- Role-based access control for clients, freelancers and administrators.
- Freelancer gig CRUD with ownership checks.
- Client booking flow that creates a linked booking and transaction record.
- Freelancer booking and income/tax dashboard.
- Admin user/transaction views and account suspension.
- Input validation, request-body sanitisation, rate limiting, Helmet/CSP, CORS restrictions and central error handling.
- Jest/Supertest backend tests, Vitest/React Testing Library frontend tests, Postman/Newman collection and GitHub Actions workflow.

## Requirements
- Node.js 22 LTS recommended
- MongoDB Community or MongoDB Atlas
- npm

## Setup
1. Copy `backend/.env.example` to `backend/.env` and replace both JWT secrets with separate, random values. Configure `MONGO_URI` for your own development database. Never commit `.env`.
2. Start backend:
   ```bash
   cd backend
   npm install
   npm start
   ```
   API defaults to `http://localhost:5000`; health check: `GET /api/health`.
3. In another terminal, configure frontend:
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
   Open the Vite URL, usually `http://localhost:5173`.
4. If using another frontend origin, set `FRONTEND_URL` in backend `.env` to that exact origin. Multiple origins can be comma-separated.

## Roles
- `client`: browse and book gigs, view own bookings.
- `freelancer`: manage own gigs, view incoming bookings and own income summary.
- `admin`: inspect users/transactions and suspend/unsuspend users. Public registration cannot create admins; provision an admin manually through a controlled database/admin process.

## API summary
See [`backend/models/API_CONTRACT.md`](backend/models/API_CONTRACT.md) for the request/response contract. Main endpoints:
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- `GET /api/gigs`, `GET /api/gigs/:id`, `GET /api/gigs/mine`, `POST /api/gigs`, `PUT/PATCH/DELETE /api/gigs/:id`
- `POST /api/bookings`, `GET /api/bookings/my`, `GET /api/bookings/client`, `GET /api/bookings/freelancer`
- `GET /api/freelancers/income`
- `GET /api/admin/users`, `GET /api/admin/transactions`, `PUT /api/admin/users/:id/suspend`, `PUT /api/admin/users/:id/unsuspend`

## Testing
Backend tests use Jest, Supertest and `mongodb-memory-server` (the first run may need to download a MongoDB test binary):
```bash
cd backend
npm install
npm test
```
Frontend tests and production build:
```bash
cd frontend
npm install
npm test
npm run build
```
Postman/Newman (with a disposable MongoDB and API running):
```bash
npx newman run postman/HustleHub.postman_collection.json --reporters cli,htmlextra --reporter-htmlextra-export newman/report.html
```
Install the reporter if it is not available: `npm install --no-save newman newman-reporter-htmlextra`, then run the command above. The CI workflow installs the reporter and uploads the generated HTML/JUnit reports as artifacts.

GitHub Actions runs backend tests, frontend tests/build, and the Postman collection. Review workflow logs and download its Newman report artifact as execution evidence.

## Security notes and assessment assumptions
- Passwords are bcrypt-hashed. Access tokens are short-lived; refresh tokens are stored hashed and rotated.
- Booking price and freelancer identity are derived from the database, not client input. A transaction record is created for every successful simulated booking.
- `TAX_RATE` defaults to `0.15` only as a configurable academic demonstration rate. It is not tax advice or a statement of actual South African tax liability.
- The demo uses local storage for frontend tokens for simplicity; a production deployment should consider secure, HttpOnly cookies, CSRF protection and a formal threat model.
- HTTPS redirect is enabled only in production and assumes a correctly configured trusted proxy. Do not enable production mode on plain local HTTP.

## Evidence checklist
- [ ] Screenshots of browse, detail, register/login, freelancer dashboard, booking confirmation, bookings and income screens saved under `screenshots/`.
- [ ] Backend and frontend automated test output captured.
- [ ] Newman HTML report generated from an actual successful run and saved under `newman/`.
- [ ] GitHub Actions workflow completed successfully and evidence/artifact saved.
- [ ] Demo video recorded from a working end-to-end setup and its accessible link added below.

