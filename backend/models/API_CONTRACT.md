# HustleHub API Contract (FROZEN)

## Base URL
http://localhost:5000/api

## Auth
POST /auth/register
  Body: { name, email, password, role }
  Response 201: { token, refreshToken, user: { id, name, email, role } }

POST /auth/login
  Body: { email, password }
  Response 200: { token, refreshToken, user: { id, name, email, role } }

POST /auth/refresh
  Body: { refreshToken }
  Response 200: { token }

## Gigs
GET /gigs → 200 [{ id, title, description, price, category, freelancerId, status }]
GET /gigs/:id → 200 { gig }
POST /gigs (freelancer) → 201 { gig }
PUT /gigs/:id (owner) → 200 { gig }
DELETE /gigs/:id (owner) → 200 { message }

## Bookings
POST /bookings (client) → 201 { booking, transaction }
GET /bookings/my (client) → 200 [{ bookings }]
GET /bookings/freelancer (freelancer) → 200 [{ bookings }]

## Income
GET /freelancers/income (freelancer) → 200 { totalIncome, totalTax, transactions }

## Admin
GET /admin/users (admin) → 200 [{ users }]
GET /admin/transactions (admin) → 200 [{ transactions }]
PUT /admin/users/:id/suspend (admin) → 200 { message }