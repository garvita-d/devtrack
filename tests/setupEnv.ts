import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Prefer a dedicated test database (.env.test) if one exists -- see
// tests/README.md for why and how to set one up with a Neon branch. Falls
// back to the regular .env so tests still run for anyone who hasn't set
// one up yet (against the same dev database, with careful cleanup in each
// test file).
const testEnvPath = path.resolve(__dirname, "../.env.test");

if (fs.existsSync(testEnvPath)) {
  dotenv.config({ path: testEnvPath, quiet: true });
} else {
  dotenv.config({ quiet: true });
  // eslint-disable-next-line no-console
  console.warn(
    "\n⚠️  No .env.test found -- tests are running against the DATABASE_URL in .env " +
      "(your regular dev database). See tests/README.md to set up an isolated test " +
      "database instead.\n"
  );
}
