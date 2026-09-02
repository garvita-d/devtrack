import { Router } from "express";
import * as ctrl from "../controllers/member.controller";
import { validate } from "../middleware/validate";
import { addMemberSchema, updateMemberRoleSchema } from "../validators/member.validators";
import { requireProjectRole } from "../middleware/requireProjectRole";

const router = Router({ mergeParams: true });

// Auth + project membership are already enforced by the parent router
// (project.routes.ts) before requests reach here.
router.get("/", ctrl.listMembers);
router.post("/", validate(addMemberSchema), requireProjectRole("OWNER", "ADMIN"), ctrl.addMember);
router.patch(
  "/:userId",
  validate(updateMemberRoleSchema),
  requireProjectRole("OWNER"),
  ctrl.updateMemberRole
);
router.delete("/:userId", requireProjectRole("OWNER", "ADMIN"), ctrl.removeMember);

export default router;
