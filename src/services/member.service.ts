import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { AddMemberInput, UpdateMemberRoleInput } from "../validators/member.validators";

export async function listMembers(projectId: string) {
  return prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });
}

export async function addMember(projectId: string, input: AddMemberInput) {
  const userExists = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!userExists) {
    throw AppError.notFound("No user with that id exists");
  }

  const alreadyMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: input.userId } },
  });
  if (alreadyMember) {
    throw AppError.conflict("User is already a member of this project");
  }

  return prisma.projectMember.create({
    data: { projectId, userId: input.userId, role: input.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function updateMemberRole(
  projectId: string,
  targetUserId: string,
  input: UpdateMemberRoleInput
) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: targetUserId } },
  });
  if (!membership) {
    throw AppError.notFound("That user is not a member of this project");
  }
  if (membership.role === "OWNER") {
    throw AppError.forbidden("The project owner's role can't be changed this way");
  }

  return prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId: targetUserId } },
    data: { role: input.role },
  });
}

export async function removeMember(projectId: string, targetUserId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: targetUserId } },
  });
  if (!membership) {
    throw AppError.notFound("That user is not a member of this project");
  }
  if (membership.role === "OWNER") {
    throw AppError.forbidden("The project owner can't be removed. Delete the project instead.");
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId: targetUserId } },
  });
}
