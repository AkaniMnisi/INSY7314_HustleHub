# HustleHub API Contract (FROZEN)

## Base URL
http://localhost:5000/api

## Conventions
- MongoDB documents use `_id` (not `id`)
- Responses return bare objects/arrays (not wrapped in `{ gig }` or `{ user }`)
- Success responses: 200/201 with data
- Error responses: `{ "error": "message" }`

## Auth
POST /auth/register
  Body: { name, email, password, role: 'client' | 'freelancer' }
  Response 201: { token, refreshToken, user: { _id, name, email, role } }

POST /auth/login
  Body: { email, password }
  Response 200: { token, refreshToken, user: { _id, name, email, role } }

POST /auth/refresh
  Body: { refreshToken }
  Response 200: { token }

## Gigs
GET /gigs → 200 [ { _id, title, description, price, category, freelancerId: { _id, name }, status } ]
GET /gigs/mine (freelancer) → 200 [ { gig } ]
GET /gigs/:id → 200 { _id, title, ..., freelancerId: { _id, name }, status }
POST /gigs (freelancer) → 201 { _id, title, ... }
PUT /gigs/:id (owner) → 200 { _id, title, ... }
DELETE /gigs/:id (owner) → 200 { message }

## Bookings (Sibusiso to fill in)
POST /bookings (client) → 201 { ... }
GET /bookings/my (client) → 200 [ { ... } ]
GET /bookings/freelancer (freelancer) → 200 [ { ... } ]

## Income (Sibusiso to fill in)
GET /freelancers/income (freelancer) → 200 { totalIncome, totalTax, transactions: [ ... ] }

## Admin
GET /admin/users (admin) → 200 [ { _id, name, email, role } ]
GET /admin/transactions (admin) → 200 [ { _id, ... } ]
PUT /admin/users/:id/suspend (admin) → 200 { message, user: { _id, name, email, role: 'suspended' } }