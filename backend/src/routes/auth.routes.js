import { Router } from "express";
import { login, register, refresh, logout } from "../controllers/auth.controller.js";
import { authController } from "../controllers/fingerprint.controller.js";

const router = Router();

router.post("/login", authController, login);
router.post("/register", authController, register);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;