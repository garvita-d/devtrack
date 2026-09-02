import { Prisma, ProjectRole } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { CreateIssueInput, ListIssuesQuery, UpdateIssueInput } from "../validators/issue.validators";

export async function createIssue(
  projectId: string,
  createdBy: string,
  input: CreateIssueInput
) {
  if (input.assignedTo) {
    await assertIsProjectMember(projectId, input.assignedTo);
  }

  return prisma.issue.create({
    data: {
      projectId,
      createdBy,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      assignedTo: input.assignedTo,
      dueDate: input.dueDate,
    },
  });
}

// GET /projects/:projectId/issues?status=&priority=&assignedTo=&search=&page=&limit=
export async function listIssues(projectId: string, query: ListIssuesQuery) {
  const where: Prisma.IssueWhereInput = {
    projectId,
    ...(query.status && { status: query.status }),
    ...(query.priority && { priority: query.priority }),
    ...(query.assignedTo && { assignedTo: query.assignedTo }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ],
    }),
  };

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.issue.count({ where }),
  ]);

  return {
    issues,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getIssueById(issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });
  if (!issue) {
    throw AppError.notFound("Issue not found");
  }
  return issue;
}

// Members can only edit issues they created or are assigned to; OWNER/ADMIN
// can edit anything in the project. This mirrors the doc's authorization
// plan ("MEMBER: create issues, edit their issues, ... update assigned
// issues").
export function assertCanMutateIssue(
  issue: { createdBy: string; assignedTo: string | null },
  userId: string,
  role: ProjectRole
) {
  if (role === "OWNER" || role === "ADMIN") return;
  const isOwnerOfIssue = issue.createdBy === userId || issue.assignedTo === userId;
  if (!isOwnerOfIssue) {
    throw AppError.forbidden("You can only edit issues you created or are assigned to");
  }
}

export async function updateIssue(issueId: string, input: UpdateIssueInput) {
  if (input.assignedTo) {
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw AppError.notFound("Issue not found");
    await assertIsProjectMember(issue.projectId, input.assignedTo);
  }

  return prisma.issue.update({
    where: { id: issueId },
    data: input,
  });
}

export async function deleteIssue(issueId: string) {
  await prisma.issue.delete({ where: { id: issueId } });
}

async function assertIsProjectMember(projectId: string, userId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) {
    throw AppError.badRequest("Cannot assign the issue to someone who isn't a project member");
  }
}
