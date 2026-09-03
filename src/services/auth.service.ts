import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { signAccessToken } from "../utils/jwt";
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
} from "../utils/refreshToken";
import { RegisterInput, LoginInput } from "../validators/auth.validators";

const SALT_ROUNDS = 12;

// Issues a fresh access token (short-lived JWT) + refresh token
// (long-lived, stored hashed in the DB so it can be looked up/revoked).
// Shared by register, login, and the refresh endpoint itself.
async function issueTokenPair(userId: string, email: string) {
  const token = signAccessToken({ userId, email });

  const rawRefreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(rawRefreshToken),
      expiresAt: refreshTokenExpiry(),
    },
  });

  return { token, refreshToken: rawRefreshToken };
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.conflict("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const { token, refreshToken } = await issueTokenPair(user.id, user.email);

  return { user, token, refreshToken };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Same generic error for "no such user" and "wrong password" — don't leak
  // which one it was, that would let an attacker enumerate registered emails.
  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const { token, refreshToken } = await issueTokenPair(user.id, user.email);

  return {
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    token,
    refreshToken,
  };
}

// Exchanges a valid, unexpired, unrevoked refresh token for a new access
// token. Rotates the refresh token too (issues a new one, revokes the old
// one) rather than reusing it -- if a stolen refresh token gets used after
// the legitimate one already rotated, the mismatch is a strong signal of
// compromise, which a non-rotating design can't detect.
export async function refreshAccessToken(rawRefreshToken: string) {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: existing.userId } });
  if (!user) {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return issueTokenPair(user.id, user.email);
}

// Used by logout. Deliberately doesn't throw or reveal whether the token
// existed -- an already-invalid or already-revoked token still results in
// "logged out" from the client's point of view.
export async function revokeRefreshToken(rawRefreshToken: string) {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  if (!user) {
    throw AppError.notFound("User not found");
  }
  return user;
}
