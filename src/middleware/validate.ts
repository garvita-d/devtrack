import { NextFunction, Request, Response } from "express";
import { z } from "zod";

// Validates req.body/query/params against a Zod schema. On success it
// replaces req.body/query/params with the *parsed* data (so defaults and
// coercions -- e.g. "page=2" string -> number -- actually apply).
// On failure it throws a ZodError, which errorHandler turns into a 400.
export function validate(schema: z.ZodObject<z.ZodRawShape>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.query !== undefined) Object.assign(req.query, parsed.query);
    if (parsed.params !== undefined) Object.assign(req.params, parsed.params);
    next();
  };
}
