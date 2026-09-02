import { z } from "zod";

const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const statusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

export const createIssueSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
    description: z.string().trim().max(5000).optional(),
    priority: priorityEnum.optional().default("MEDIUM"),
    status: statusEnum.optional().default("TODO"),
    assignedTo: z.string().uuid().optional(),
    dueDate: z.coerce.date().optional(),
  }),
});

export const updateIssueSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(5000).optional(),
    priority: priorityEnum.optional(),
    status: statusEnum.optional(),
    assignedTo: z.string().uuid().nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
  }),
});

// GET /api/projects/:projectId/issues?status=&priority=&assignedTo=&search=&page=&limit=
export const listIssuesQuerySchema = z.object({
  query: z.object({
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    assignedTo: z.string().uuid().optional(),
    search: z.string().trim().min(1).max(200).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>["body"];
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>["body"];
export type ListIssuesQuery = z.infer<typeof listIssuesQuerySchema>["query"];
