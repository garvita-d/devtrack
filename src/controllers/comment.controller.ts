import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as commentService from "../services/comment.service";
import { AppError } from "../utils/AppError";
import { prisma } from "../config/prisma";

// Mounted after loadIssueContext, so project membership is already verified.
export const listComments = catchAsync(async (req: Request, res: Response) => {
  const comments = await commentService.listComments(req.params.issueId);
  res.status(200).json({ success: true, data: { comments } });
});

export const createComment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const comment = await commentService.createComment(
    req.params.issueId,
    req.user.userId,
    req.body
  );
  res.status(201).json({ success: true, data: { comment } });
});

// /api/comments/:id doesn't carry a project or issue id in the URL, so we
// look the comment up first, then check: the caller must be the comment's
// author, or an OWNER/ADMIN of the project it belongs to.
async function assertCanMutateComment(commentAuthorId: string, projectId: string, userId: string) {
  if (commentAuthorId === userId) return;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw AppError.forbidden("You can only edit or delete your own comments");
  }
}

export const updateComment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const existing = await commentService.getCommentWithProject(req.params.id);

  // Only the author may edit the content of their own comment (unlike
  // delete, this isn't a moderation action OWNER/ADMIN should be able to do
  // on someone else's words).
  if (existing.userId !== req.user.userId) {
    throw AppError.forbidden("You can only edit your own comments");
  }

  const comment = await commentService.updateComment(req.params.id, req.body);
  res.status(200).json({ success: true, data: { comment } });
});

export const deleteComment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const existing = await commentService.getCommentWithProject(req.params.id);
  await assertCanMutateComment(existing.userId, existing.issue.projectId, req.user.userId);
  await commentService.deleteComment(req.params.id);
  res.status(200).json({ success: true, message: "Comment deleted" });
});
