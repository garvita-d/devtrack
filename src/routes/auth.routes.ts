import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "../validators/auth.validators";
import { authenticateUser } from "../middleware/authenticateUser";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", authenticateUser, logout);
router.get("/me", authenticateUser, me);

export default router;
