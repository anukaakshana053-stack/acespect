# ACE SPECT — Backend (Auth + API)

Node.js · Express · TypeScript · Prisma · PostgreSQL (Supabase).
Custom JWT auth (access + rotating refresh tokens). Express owns business
logic and the database; the mobile app talks only to this API.

## Stack

| Concern | Choice |
|---|---|
| Runtime | Node ≥ 20, Express 4, TypeScript |
| ORM / DB | Prisma + PostgreSQL (Supabase in prod, Docker locally) |
| Auth | JWT access token (15 min) + opaque rotating refresh token (7 d, hashed in DB) |
| Validation | Zod (per-route schemas) |
| Security | helmet, CORS all-list, bcrypt (cost 12), rate limiting |

## Project structure

```
src/
├── config/env.ts          validated environment (fail-fast)
├── lib/prisma.ts          PrismaClient singleton
├── middleware/            auth (JWT + RBAC), validate, rateLimit, errorHandler
├── utils/                 jwt, password, refreshToken, ApiError, asyncHandler
├── modules/auth/          schemas · service · controller · routes
├── types/express.d.ts     Request.user augmentation
├── app.ts                 express app (middleware + routes)
└── server.ts              bootstrap + graceful shutdown
prisma/schema.prisma       User + RefreshToken (+ Role enum)
```

## Quick start

```bash
npm install
cp .env.example .env                 # then set strong JWT secrets

# Option A — local Postgres via Docker (fastest)
docker compose up -d                  # starts postgres on :5432 (matches .env.example)

# Option B — Supabase: set DATABASE_URL in .env to your project's connection string

npm run prisma:migrate                # creates tables
npm run dev                           # http://localhost:4000
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## API (`/api/v1/auth`)

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/register` | — | `{ email, password, name? }` | `201 { user, accessToken, refreshToken }` |
| POST | `/login` | — | `{ email, password }` | `200 { user, accessToken, refreshToken }` |
| POST | `/refresh` | — | `{ refreshToken }` | `200 { user, accessToken, refreshToken }` (rotates) |
| POST | `/logout` | — | `{ refreshToken }` | `200 { success: true }` |
| GET | `/me` | Bearer | — | `200 { user }` |
| GET | `/health` | — | — | `200 { status: "ok" }` |

Errors are consistent: `{ "error": { "message", "code", "details?" } }`.

## Why these choices

- **Custom auth (not Supabase Auth):** Express must own the auth flow and sit in
  front of the DB; Supabase is used purely as managed Postgres. Keeps one source
  of truth and lets the same service later issue tokens for the WatermelonDB sync.
- **Opaque rotating refresh tokens, hashed at rest:** individually revocable and
  safe under a DB leak — a stateless JWT refresh token is neither.
- **RBAC wired now (`requireRole`), one role used:** adding ADMIN/REVIEWER/CLIENT
  later is a route annotation, not a refactor.
