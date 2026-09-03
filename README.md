# DevTrack — Project & Issue Management API

A Jira/Trello-style backend: multi-user projects, role-based access control
(OWNER / ADMIN / MEMBER), issues with assignment/status/priority, comments,
filtering, and pagination.

## Live demo

- API: https://devtrack-fca2.onrender.com
- Interactive docs: https://devtrack-fca2.onrender.com/api-docs

Hosted on Render's free tier, so the first request after a period of
inactivity can take up to a minute to wake back up — that's expected, not
a bug.

## Stack

Node.js · Express · TypeScript · PostgreSQL · Prisma ORM 7 (Rust-free,
driver-adapter architecture — no native binary to install or deploy) · JWT ·
bcrypt · Zod · Jest + Supertest · Swagger UI (OpenAPI 3.0)

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

DATABASE_URL="postgresql://user:password@localhost:5432/devtrack_dev"
JWT_SECRET="generate a long random string here"
JWT_EXPIRES_IN="15m"
PORT=4000
NODE_ENV=development


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
| Projects | `POST/GET /api/projects`, `GET/PATCH/DELETE /api/projects/:id`, `GET /api/projects/:id/analytics` |
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
src/
├── controllers/ thin request/response layer
├── services/ business logic, the only layer that talks to Prisma
├── routes/ Express routers (nested + top-level, see table above)
├── middleware/ auth, RBAC, validation, centralized error handling
├── validators/ Zod schemas per resource
├── config/ env loading, Prisma client singleton
└── generated/ (gitignored) Prisma client output
prisma/
└── schema.prisma full data model


## What's built so far (Phase 1 + 2 of the roadmap)

- ✅ Auth: register/login/logout/me, JWT, bcrypt
- ✅ Projects: full CRUD, ownership on create
- ✅ Members: add/remove/list, role changes
- ✅ Issues: full CRUD, assignment, filtering, search, pagination
- ✅ Comments: full CRUD
- ✅ RBAC (OWNER/ADMIN/MEMBER) enforced across every mutating route
- ✅ Centralized error handling (validation, auth, not-found, conflict, unexpected)
- ✅ Automated tests (Jest + Supertest) — auth, projects, RBAC, and
  analytics. See `tests/README.md` for how to run them and how to set up
  an isolated test database.
- ✅ Analytics endpoint (`GET /api/projects/:id/analytics`) — issue counts
  by status and priority, e.g.:
```json
  {
    "totalIssues": 12,
    "todo": 4,
    "inProgress": 3,
    "completed": 5,
    "highPriority": 2,
    "byPriority": { "low": 3, "medium": 5, "high": 3, "critical": 1 },
    "unassignedIssues": 6
  }
```
- ✅ Interactive API docs — start the server and open
  `http://localhost:4000/api-docs` for a Swagger UI covering every
  endpoint (try-it-out included: click "Authorize" and paste a token from
  `/auth/login` to test protected routes right from the browser). Raw
  OpenAPI JSON is at `/api-docs.json`. Source: `src/docs/openapi.ts`.

## Not yet built (next phases)

- Rate limiting, refresh tokens, structured logging

## Deployment

Deployed on [Render](https://render.com) (free tier), using the existing
Neon database as-is — no separate production database needed.

- **Build Command**: `npm install --include=dev && npx prisma generate && npm run build`
  (`--include=dev` is required: Render sets `NODE_ENV=production` before
  `npm install` runs, which makes npm skip `devDependencies` by default —
  but TypeScript and the `@types/*` packages live there and are needed to
  compile.)
- **Start Command**: `npm start`
- **Environment variables**: `DATABASE_URL` (Neon connection string),
  `JWT_SECRET` (a separate one from local dev), `JWT_EXPIRES_IN=15m`,
  `NODE_ENV=production`. Don't set `PORT` — Render injects it and
  `src/config/env.ts` already reads `process.env.PORT`.
- **No migration step in the build**: `prisma migrate deploy` doesn't
  accept a `--url` override flag (only `migrate dev` does), and hits the
  same "datasource.url property is required" bug described below with no
  workaround. Since Render points at the same Neon database already
  migrated from local development, this isn't needed here — the tables
  already exist. If the schema changes in the future, run
  `npx prisma migrate dev --name <name> --url="$DATABASE_URL"` locally
  against the shared database before deploying, rather than relying on
  the build step to migrate.

## A note on the Prisma setup

This project uses Prisma ORM 7's newer **Rust-free** architecture
(`@prisma/adapter-pg` + a TypeScript query compiler) instead of the older
native query-engine binary. Functionally it's the same Prisma API you'd read
about in most tutorials (`prisma.user.findUnique(...)`, etc.) — the only
visible differences are the `output` path in `schema.prisma`'s generator
block and that `PrismaClient` is constructed with an `adapter` in
`src/config/prisma.ts`. This is Prisma's current recommended setup as of
late 2025/2026 (smaller bundles, no binary-size headaches when deploying).

## Troubleshooting

- **`prisma migrate dev` fails with "datasource.url property is required"
  even though it's set in `prisma.config.ts`**: this is an open bug in
  recent Prisma 7.x releases. Workaround: pass the URL directly, e.g.
  `npx prisma migrate dev --name init --url="$DATABASE_URL"` (this also
  applies to `prisma studio`). Note that `prisma migrate deploy` does
  *not* support a `--url` flag at all (that option only exists on
  `migrate dev`) — see the Deployment section above for how this project
  works around that in practice.
- **Server can't find `../generated/prisma`**: the `prisma-client`
  generator's entry file is `client.ts`, not `index.ts`. Every import
  needs to be `"../generated/prisma/client"`, not `"../generated/prisma"`.
- **"Unable to start a transaction in the given time" on project
  creation**: Prisma's default transaction timeouts (2s/5s) can be too
  tight over a long geographic distance to your database, or when using
  a connection pooler. `createProject` already sets a longer
  `{ maxWait: 10000, timeout: 15000 }`. If it still happens, try Neon's
  *unpooled* connection string (toggle "Connection pooling" off in
  Neon's connect dialog) instead of the pooled one.