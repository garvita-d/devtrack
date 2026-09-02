import { Router } from "express";
import * as ctrl from "../controllers/comment.controller";
import { validate } from "../middleware/validate";
import { updateCommentSchema } from "../validators/comment.validators";
import { authenticateUser } from "../middleware/authenticateUser";

const router = Router();

router.use(authenticateUser);

router.patch("/:id", validate(updateCommentSchema), ctrl.updateComment);
router.delete("/:id", ctrl.deleteComment);

export default router;
