import crypto from "crypto";

export const REFRESH_TOKEN_TTL_DAYS = 7;

// The raw token is what goes to the client and never touches the
// database. Only its hash is stored, the same principle as password
// hashing -- if the database ever leaked, stored hashes alone can't be
// replayed as valid refresh tokens.
export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}
