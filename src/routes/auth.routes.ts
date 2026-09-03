import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "../validators/auth.validators";
import { authenticateUser } from "../middleware/authenticateUser";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", authenticateUser, logout);
router.get("/me", authenticateUser, me);

export default router;
