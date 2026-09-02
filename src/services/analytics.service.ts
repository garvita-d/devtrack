import { prisma } from "../config/prisma";
import { IssuePriority, IssueStatus } from "../generated/prisma/client";

export async function getProjectAnalytics(projectId: string) {
  const [statusCounts, priorityCounts, totalIssues, unassignedIssues] = await Promise.all([
    prisma.issue.groupBy({
      by: ["status"],
      where: { projectId },
      _count: { _all: true },
    }),
    prisma.issue.groupBy({
      by: ["priority"],
      where: { projectId },
      _count: { _all: true },
    }),
    prisma.issue.count({ where: { projectId } }),
    prisma.issue.count({ where: { projectId, assignedTo: null } }),
  ]);

  const byStatus: Record<IssueStatus, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  for (const row of statusCounts) {
    byStatus[row.status] = row._count._all;
  }

  const byPriority: Record<IssuePriority, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };
  for (const row of priorityCounts) {
    byPriority[row.priority] = row._count._all;
  }

  return {
    totalIssues,
    todo: byStatus.TODO,
    inProgress: byStatus.IN_PROGRESS,
    completed: byStatus.DONE,
    // "Needs attention" figure -- HIGH and CRITICAL combined.
    highPriority: byPriority.HIGH + byPriority.CRITICAL,
    byPriority: {
      low: byPriority.LOW,
      medium: byPriority.MEDIUM,
      high: byPriority.HIGH,
      critical: byPriority.CRITICAL,
    },
    unassignedIssues,
  };
}
