import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateCommentInput, UpdateCommentInput } from "../validators/comment.validators";

export async function listComments(issueId: string) {
  return prisma.comment.findMany({
    where: { issueId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function createComment(issueId: string, userId: string, input: CreateCommentInput) {
  return prisma.comment.create({
    data: { issueId, userId, content: input.content },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

// Loads the comment along with its parent issue's projectId, so the
// controller can run RBAC (project role) and ownership (comment author)
// checks without a second round trip.
export async function getCommentWithProject(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { issue: { select: { projectId: true } } },
  });
  if (!comment) {
    throw AppError.notFound("Comment not found");
  }
  return comment;
}

export async function updateComment(commentId: string, input: UpdateCommentInput) {
  return prisma.comment.update({
    where: { id: commentId },
    data: { content: input.content },
  });
}

export async function deleteComment(commentId: string) {
  await prisma.comment.delete({ where: { id: commentId } });
}
