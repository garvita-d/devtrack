import { Router } from "express";
import * as ctrl from "../controllers/comment.controller";
import { validate } from "../middleware/validate";
import { createCommentSchema } from "../validators/comment.validators";

const router = Router({ mergeParams: true });

// Auth + issue-project membership already enforced by loadIssueContext on
// the parent router before requests reach here.
router.get("/", ctrl.listComments);
router.post("/", validate(createCommentSchema), ctrl.createComment);

export default router;
