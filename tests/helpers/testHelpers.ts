import request from "supertest";
import { createApp } from "../../src/app";
import { prisma } from "../../src/config/prisma";

export const app = createApp();

// Generates a unique, valid test email each call so tests can run
// repeatedly (including against a shared database) without colliding on
// the unique email constraint.
export function testEmail(label: string): string {
  return `test-${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

// Registers a throwaway user via the real API (not a direct DB insert --
// this keeps tests exercising the same code path as everything else) and
// returns their id + auth token, ready to use in an Authorization header.
export async function registerTestUser(label: string) {
  const email = testEmail(label);
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: `Test ${label}`, email, password: "password123" });

  if (res.status !== 201) {
    throw new Error(`registerTestUser("${label}") failed: ${JSON.stringify(res.body)}`);
  }

  return {
    userId: res.body.data.user.id as string,
    email,
    token: res.body.data.token as string,
  };
}

// Deletes everything a test created, in an order that respects foreign
// keys: projects first (this cascades to their members, issues, and
// comments per the schema), then the users themselves.
export async function cleanupTestData(opts: { userIds?: string[]; projectIds?: string[] }) {
  if (opts.projectIds?.length) {
    await prisma.project.deleteMany({ where: { id: { in: opts.projectIds } } });
  }
  if (opts.userIds?.length) {
    await prisma.user.deleteMany({ where: { id: { in: opts.userIds } } });
  }
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
