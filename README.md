# DevTrack — Project & Issue Management API

A Jira/Trello-style backend: multi-user projects, role-based access control
(OWNER / ADMIN / MEMBER), issues with assignment/status/priority, comments,
filtering, and pagination.

## Stack

Node.js · Express · TypeScript · PostgreSQL · Prisma ORM 7 (Rust-free,
driver-adapter architecture — no native binary to install or deploy) · JWT ·
bcrypt · Zod

## Getting started

### 1. Prerequisites

- Node.js 20+
- A PostgreSQL database (local install, or a free instance on
  [Railway](https://railway.app), [Render](https://render.com), or
  [Neon](https://neon.tech))

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/devtrack_dev"
JWT_SECRET="generate a long random string here"
JWT_EXPIRES_IN="15m"
PORT=4000
NODE_ENV=development
```

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Generate the Prisma client and run the migration

```bash
npx prisma generate
npx prisma migrate dev --name init
```

This creates all 5 tables (users, projects, project_members, issues,
comments) in your database. `prisma generate` writes the typed client to
`src/generated/prisma` (gitignored — every clone/deploy regenerates it).

### 5. Run the dev server

```bash
npm run dev
```

Server starts at `http://localhost:4000`. Check `GET /health`.

## API overview

| Resource | Routes |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Projects | `POST/GET /api/projects`, `GET/PATCH/DELETE /api/projects/:id` |
| Members | `GET/POST /api/projects/:id/members`, `PATCH/DELETE /api/projects/:id/members/:userId` |
| Issues | `POST/GET /api/projects/:projectId/issues`, `GET/PATCH/DELETE /api/issues/:id` |
| Comments | `GET/POST /api/issues/:issueId/comments`, `PATCH/DELETE /api/comments/:id` |

All routes except register/login require `Authorization: Bearer <token>`.

**Issue filtering/pagination:**
`GET /api/projects/:projectId/issues?status=IN_PROGRESS&priority=HIGH&assignedTo=<userId>&search=auth&page=1&limit=20`

## Authorization model

| Role | Can do |
|---|---|
| **OWNER** | Everything — delete project, add/remove members, change roles |
| **ADMIN** | Manage issues/comments, add/remove members (not change roles), manage project content |
| **MEMBER** | Create issues, edit/delete issues they created or are assigned to, comment |

Every mutating endpoint enforces this at the route layer (`requireProjectRole`
middleware) or, for resources that don't carry a project id in the URL
(`/api/issues/:id`, `/api/comments/:id`), by loading the parent
project/issue first and then checking role + ownership.

## Project structure

```
src/
├── controllers/   thin request/response layer
├── services/      business logic, the only layer that talks to Prisma
├── routes/        Express routers (nested + top-level, see table above)
├── middleware/     auth, RBAC, validation, centralized error handling
├── validators/     Zod schemas per resource
├── config/         env loading, Prisma client singleton
└── generated/      (gitignored) Prisma client output
prisma/
└── schema.prisma   full data model
```

## What's built so far (Phase 1 + 2 of the roadmap)

- ✅ Auth: register/login/logout/me, JWT, bcrypt
- ✅ Projects: full CRUD, ownership on create
- ✅ Members: add/remove/list, role changes
- ✅ Issues: full CRUD, assignment, filtering, search, pagination
- ✅ Comments: full CRUD
- ✅ RBAC (OWNER/ADMIN/MEMBER) enforced across every mutating route
- ✅ Centralized error handling (validation, auth, not-found, conflict, unexpected)

## Not yet built (next phases)

- Automated tests (Jest/Vitest + Supertest)
- Analytics endpoint (`GET /api/projects/:id/analytics`)
- Swagger/OpenAPI docs
- Rate limiting, refresh tokens, structured logging
- Deployment config

## A note on the Prisma setup

This project uses Prisma ORM 7's newer **Rust-free** architecture
(`@prisma/adapter-pg` + a TypeScript query compiler) instead of the older
native query-engine binary. Functionally it's the same Prisma API you'd read
about in most tutorials (`prisma.user.findUnique(...)`, etc.) — the only
visible differences are the `output` path in `schema.prisma`'s generator
block and that `PrismaClient` is constructed with an `adapter` in
`src/config/prisma.ts`. This is Prisma's current recommended setup as of
late 2025/2026 (smaller bundles, no binary-size headaches when deploying).
