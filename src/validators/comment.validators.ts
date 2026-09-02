import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1, "Comment can't be empty").max(3000),
  }),
});

export const updateCommentSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1, "Comment can't be empty").max(3000),
  }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>["body"];
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>["body"];
