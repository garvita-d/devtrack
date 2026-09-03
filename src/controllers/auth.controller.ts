import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as authService from "../services/auth.service";
import { AppError } from "../utils/AppError";

export const register = catchAsync(async (req: Request, res: Response) => {
  const { user, token, refreshToken } = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data: { user, token, refreshToken } });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { user, token, refreshToken } = await authService.loginUser(req.body);
  res.status(200).json({ success: true, data: { user, token, refreshToken } });
});

// Exchanges a refresh token for a new access token (and a new, rotated
// refresh token). Not behind authenticateUser -- this IS how you recover
// from an expired access token, so it can't require a valid one.
export const refresh = catchAsync(async (req: Request, res: Response) => {
  const { token, refreshToken } = await authService.refreshAccessToken(req.body.refreshToken);
  res.status(200).json({ success: true, data: { token, refreshToken } });
});

// Revokes the given refresh token server-side, so it can no longer be used
// to mint new access tokens. The (still-valid-until-expiry) access token
// itself can't be revoked -- that's the tradeoff of stateless JWTs -- but
// this is a real, meaningful logout for the session as a whole.
export const logout = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.body?.refreshToken === "string") {
    await authService.revokeRefreshToken(req.body.refreshToken);
  }
  res.status(200).json({ success: true, message: "Logged out" });
});

export const me = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const user = await authService.getUserById(req.user.userId);
  res.status(200).json({ success: true, data: { user } });
});
