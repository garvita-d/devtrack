import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import { logger } from "../config/logger";

// Express recognizes this as an error-handling middleware because it takes
// FOUR arguments. It must be registered last, after all routes.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // Known, expected errors we threw ourselves (AppError.notFound(), etc.)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Zod validation errors -> 400 with field-level detail
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  // Prisma "known request errors" — map the common ones to sensible HTTP codes
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: `A record with this ${(err.meta?.target as string[])?.join(", ") ?? "value"} already exists`,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }
  }

  // Anything else is unexpected — log it fully server-side, but never leak
  // internals (stack traces, SQL, etc.) to the client.
  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");

  return res.status(500).json({
    success: false,
    message:
      env.nodeEnv === "development" && err instanceof Error
        ? err.message
        : "Internal server error",
  });
}

// 404 handler for routes that don't match anything — registered after all
// real routes, before the error handler.
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}
