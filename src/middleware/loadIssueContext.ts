import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { Issue, ProjectRole } from "../generated/prisma/client";

declare global {
  namespace Express {
    interface Request {
      issue?: Issue;
    }
  }
}

// /api/issues/:id routes don't carry a projectId in the URL, so before we
// can apply RBAC we first have to look up which project the issue belongs
// to. Attaches req.issue and req.projectRole for the controller to use.
export const loadIssueContext = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();

    const issue = await prisma.issue.findUnique({
      where: { id: req.params.id ?? req.params.issueId },
    });
    if (!issue) {
      throw AppError.notFound("Issue not found");
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: issue.projectId, userId: req.user.userId } },
      select: { role: true },
    });
    if (!membership) {
      throw AppError.forbidden("You are not a member of this issue's project");
    }

    req.issue = issue;
    req.projectRole = membership.role as ProjectRole;
    next();
  }
);
