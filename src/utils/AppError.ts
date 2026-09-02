// A single error class used everywhere in the app so the error-handling
// middleware always knows how to turn a thrown error into a clean HTTP
// response, instead of every controller inventing its own shape.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // expected error we deliberately threw
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request") {
    return new AppError(message, 400);
  }
  static unauthorized(message = "Unauthenticated") {
    return new AppError(message, 401);
  }
  static forbidden(message = "Forbidden") {
    return new AppError(message, 403);
  }
  static notFound(message = "Resource not found") {
    return new AppError(message, 404);
  }
  static conflict(message = "Conflict") {
    return new AppError(message, 409);
  }
}
