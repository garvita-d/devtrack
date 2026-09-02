import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import {
  CreateProjectInput,
  UpdateProjectInput,
} from "../validators/project.validators";

// Creating a project makes the creator its OWNER. Both writes happen in a
// transaction so we never end up with a project that has no owner-member
// row (e.g. if the process crashed between the two inserts).
export async function createProject(userId: string, input: CreateProjectInput) {
  return prisma.$transaction(
    async (tx) => {
      const project = await tx.project.create({
        data: {
          name: input.name,
          description: input.description,
          ownerId: userId,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          role: "OWNER",
        },
      });

      return project;
    },
    { maxWait: 10000, timeout: 15000 },
  );
}

export async function listMyProjects(userId: string) {
  return prisma.project.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { issues: true, members: true } },
    },
  });
}

export async function getProjectById(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { issues: true } },
    },
  });
  if (!project) {
    throw AppError.notFound("Project not found");
  }
  return project;
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
) {
  return prisma.project.update({
    where: { id: projectId },
    data: input,
  });
}

export async function deleteProject(projectId: string) {
  // ON DELETE CASCADE on members/issues/comments handles the rest.
  await prisma.project.delete({ where: { id: projectId } });
}
