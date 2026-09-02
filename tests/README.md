# Running the tests

```bash
npm test
```

This runs every `*.test.ts` file under `tests/` with Jest + Supertest,
against the real Express app (no mocking) and a real Postgres database.

`--runInBand` is already wired into the `test` script -- tests run one
file at a time rather than in parallel. This matters because the tests
share one database; running them concurrently could cause different test
files to race on cleanup.

## Test database (recommended, not required)

By default, tests run against whatever `DATABASE_URL` is in your regular
`.env` -- your normal dev database. Each test creates its own users/projects
with unique emails and cleans up after itself in `afterAll`, so this is
safe, but it does mean test runs add and remove rows from the same
database you're using for manual testing.

For a cleaner setup, give tests their own database:

1. In the Neon dashboard, go to **Branches** → **New branch**. Base it on
   your `production` branch -- this instantly copies the current schema
   (and data) into a new branch called e.g. `test`, no migration needed.
2. Open the new branch, grab its connection string the same way you did
   for the main one (Connect → Show password → Copy snippet).
3. Create a file called `.env.test` in the project root:
   ```
   DATABASE_URL="paste the test branch's connection string here"
   JWT_SECRET="any string -- doesn't need to match your real one"
   JWT_EXPIRES_IN="15m"
   NODE_ENV=test
   ```
4. Run `npm test` again. `tests/setupEnv.ts` automatically prefers
   `.env.test` over `.env` when it exists -- no other change needed.

## What's covered

- `tests/auth.test.ts` -- register, duplicate email rejection, login
  (valid + invalid password), protected-route rejection with a bad/missing
  JWT.
- `tests/projects.test.ts` -- create (and its OWNER membership side
  effect), rejecting unauthenticated creation, that project lists don't
  leak other users' projects, update, delete.
- `tests/authorization.test.ts` -- the RBAC rules specifically: OWNER can
  delete a project, a plain MEMBER cannot; an ADMIN can edit issues they
  don't own; a MEMBER cannot edit an issue they neither created nor are
  assigned to; only an OWNER (not an ADMIN) can change another member's
  role.

## Adding more tests

`tests/helpers/testHelpers.ts` exports:
- `app` -- the Express app (Supertest wraps this directly, no server/port
  needed)
- `registerTestUser(label)` -- registers a throwaway user via the real API
  and returns `{ userId, email, token }`
- `cleanupTestData({ userIds, projectIds })` -- deletes projects first (so
  their members/issues/comments cascade away), then users. Call this in
  every `afterAll`.
