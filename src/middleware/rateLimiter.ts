import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// The test suite legitimately calls /auth/register and /auth/login dozens
// of times in a single run (every test that needs a user does this) --
// real user-facing limits would make the tests themselves fail. Skip
// enforcement when running under Jest; the routes and logic are still
// exercised identically, just not throttled. Checking JEST_WORKER_ID
// (which Jest always sets) rather than only NODE_ENV=test means this
// works even without a dedicated .env.test file.
const skipInTests = () => env.nodeEnv === "test" || process.env.JEST_WORKER_ID !== undefined;

// Applied only to register/login: these are the endpoints someone would
// actually brute-force (guessing passwords, spamming account creation).
// 10 attempts per 15 minutes per IP is generous for a real user who
// mistypes a password a few times, but blocks scripted guessing.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: {
    success: false,
    message: "Too many attempts from this IP. Try again in a few minutes.",
  },
});

// A looser, general-purpose limiter for the rest of the API -- baseline
// protection against accidental infinite loops or scripted abuse, without
// getting in the way of normal use.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: {
    success: false,
    message: "Too many requests from this IP. Try again in a few minutes.",
  },
});
