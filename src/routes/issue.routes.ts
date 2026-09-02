import { Router } from "express";
import * as ctrl from "../controllers/issue.controller";
import { validate } from "../middleware/validate";
import { updateIssueSchema } from "../validators/issue.validators";
import { authenticateUser } from "../middleware/authenticateUser";
import { loadIssueContext } from "../middleware/loadIssueContext";
import commentNestedRoutes from "./comment.nested.routes";

const router = Router();

router.use(authenticateUser);

router.get("/:id", loadIssueContext, ctrl.getIssue);
router.patch("/:id", validate(updateIssueSchema), loadIssueContext, ctrl.updateIssue);
router.delete("/:id", loadIssueContext, ctrl.deleteIssue);

router.use("/:issueId/comments", loadIssueContext, commentNestedRoutes);

export default router;
