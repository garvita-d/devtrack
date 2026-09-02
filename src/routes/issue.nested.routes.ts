import { Router } from "express";
import * as ctrl from "../controllers/issue.controller";
import { validate } from "../middleware/validate";
import { createIssueSchema, listIssuesQuerySchema } from "../validators/issue.validators";

const router = Router({ mergeParams: true });

// Auth + project membership already enforced by the parent project router.
router.post("/", validate(createIssueSchema), ctrl.createIssue);
router.get("/", validate(listIssuesQuerySchema), ctrl.listIssues);

export default router;
