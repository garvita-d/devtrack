import { z } from "zod";

export const addMemberSchema = z.object({
  body: z.object({
    userId: z.string().uuid("userId must be a valid user id"),
    role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
    // OWNER is deliberately excluded here — ownership only transfers via a
    // dedicated action, never by "adding" someone as OWNER.
  }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(["ADMIN", "MEMBER"]),
  }),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>["body"];
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>["body"];
