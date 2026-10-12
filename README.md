# HustleHub

A secure freelance marketplace platform where freelancers advertise services and clients browse and book them. Built with the MERN stack.

**INSY7314 Portfolio of Evidence — Part 2**

## Team

| Member | Student Number | Role |
|--------|---------------|------|
| Akani Mnisi | ST10456371 | Backend + Security |
| Blake Vetter | ST10452618 | Frontend (React) |
| Sibusiso Jele | ST10294460 | Integration + Testing + Docs |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | MongoDB (Atlas) |
| Auth | JWT + bcrypt |
| Testing | Jest + Supertest + Postman/Newman |
| CI/CD | GitHub Actions |

## Architecture

The system follows the MERN architecture with clear separation between frontend, backend API, and database. See `API_CONTRACT.md` for the full API specification.

## Features

- User registration and authentication (client, freelancer, admin roles)
- Role-based access control (RBAC) with suspended-user detection
- Freelancer gig management (create, read, update, delete)
- Client browsing and booking of gigs
- Transaction recording on bookings
- Income and tax estimation for freelancers
- Admin dashboard (users, transactions, suspend)
- Rate limiting, input validation, sanitization, security headers

## Security

- **Password hashing:** bcrypt with 12 salt rounds
- **Authentication:** JWT (1-hour access token, 7-day refresh token)
- **Authorization:** Role-based middleware (`requireRole`)
- **Suspended users:** Rejected at login and on every authenticated request
- **Input validation:** `express-validator` on auth and gig routes
- **Sanitization:** `express-mongo-sanitize` (Express 5 compatible pattern)
- **Rate limiting:**
  - Auth endpoints: 5 requests / 15 min
  - General auth: 100 requests / 15 min
  - Bookings: 20 requests / 15 min
- **Security headers:** Helmet with CSP + HSTS
- **CORS:** Restricted to `FRONTEND_URL`
- **HTTPS:** Enforced in production via reverse-proxy redirect
- **Error handling:** Global handler; no stack traces in production

## Setup Instructions

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Git

### Backend

1. Clone the repo:
   ```bash
   git clone https://github.com/AkaniMnisi/INSY7314_HustleHub.git
   cd INSY7314_HustleHub/backend