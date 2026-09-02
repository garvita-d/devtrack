import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { ProjectRole } from "../generated/prisma/client";
import { catchAsync } from "../utils/catchAsync";

declare global {
  namespace Express {
    interface Request {
      projectRole?: ProjectRole;
    }
  }
}

// Route
//   ↓
// authenticateUser        (who are you?)
//   ↓
// requireProjectRole(...) (are you allowed to do this, in THIS project?)
//   ↓
// Controller
//
// Works on any route where the project id is either `:projectId` (nested
// routes like /projects/:projectId/issues) or `:id` (direct project routes
// like /projects/:id). Pass no roles to just require membership; pass
// specific roles (e.g. "OWNER", "ADMIN") to require one of those roles.
export function requireProjectRole(...roles: ProjectRole[]) {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const projectId = req.params.projectId ?? req.params.id;
    if (!projectId) {
      throw AppError.badRequest("Project id missing from route");
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.userId } },
      select: { role: true },
    });

    if (!membership) {
      throw AppError.forbidden("You are not a member of this project");
    }

    if (roles.length > 0 && !roles.includes(membership.role)) {
      throw AppError.forbidden(
        `This action requires one of these roles: ${roles.join(", ")}`
      );
    }

    req.projectRole = membership.role;
    next();
  });
}
