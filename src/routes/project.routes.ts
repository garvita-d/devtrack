import { Router } from "express";
import * as ctrl from "../controllers/project.controller";
import * as analyticsCtrl from "../controllers/analytics.controller";
import { authenticateUser } from "../middleware/authenticateUser";
import { validate } from "../middleware/validate";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project.validators";
import { requireProjectRole } from "../middleware/requireProjectRole";
import memberRoutes from "./member.routes";
import issueNestedRoutes from "./issue.nested.routes";

const router = Router();

router.use(authenticateUser);

router.post("/", validate(createProjectSchema), ctrl.createProject);
router.get("/", ctrl.listMyProjects);
router.get("/:id", requireProjectRole(), ctrl.getProject);
router.get(
  "/:id/analytics",
  requireProjectRole(),
  analyticsCtrl.getProjectAnalytics,
);
router.patch(
  "/:id",
  validate(updateProjectSchema),
  requireProjectRole("OWNER", "ADMIN"),
  ctrl.updateProject,
);
router.delete("/:id", requireProjectRole("OWNER"), ctrl.deleteProject);

// Members: only reachable once requireProjectRole() below confirms the
// caller is at least a MEMBER; each individual member route then applies
// its own stricter role requirement (see member.routes.ts).
router.use("/:id/members", requireProjectRole(), memberRoutes);

// Issues: same pattern -- membership required to create/list, nested
// router mounted under the project.
router.use("/:projectId/issues", requireProjectRole(), issueNestedRoutes);

export default router;
