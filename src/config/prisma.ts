import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "./env";

// Prisma ORM 7 runs Rust-free by default: instead of a bundled query-engine
// binary, it uses a driver adapter (here, the standard `pg` pool) plus a
// TypeScript query compiler. This is why the schema's generator block sets
// output = "../src/generated/prisma" instead of importing from
// "@prisma/client" directly -- the client is generated into our own source
// tree using this project's own `pg` connection.
const adapter = new PrismaPg({ connectionString: env.databaseUrl });

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
  });

if (env.nodeEnv === "development") {
  global.__prisma = prisma;
}
