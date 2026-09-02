import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as authService from "../services/auth.service";
import { AppError } from "../utils/AppError";

export const register = catchAsync(async (req: Request, res: Response) => {
  const { user, token } = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data: { user, token } });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { user, token } = await authService.loginUser(req.body);
  res.status(200).json({ success: true, data: { user, token } });
});

// With a stateless JWT there's no server-side session to destroy — the
// client just discards the token. This endpoint exists so the frontend has
// a consistent, documented "logout" call, and it's the natural place to
// plug in refresh-token revocation later.
export const logout = catchAsync(async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Logged out" });
});

export const me = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const user = await authService.getUserById(req.user.userId);
  res.status(200).json({ success: true, data: { user } });
});
