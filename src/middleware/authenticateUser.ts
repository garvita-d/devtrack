import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/jwt";

// Request
//   ↓
// JWT Middleware  <-- this file
//   ↓
// Verify token
//   ↓
// Extract user ID
//   ↓
// Attach user to request
//   ↓
// Controller
export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Missing or malformed Authorization header"));
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(AppError.unauthorized("Invalid or expired token"));
  }
}
