import { Router } from "express";
import authAudit from "../middleware/authAudit.middleware.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post(
  "/register",
  authAudit("USER_REGISTER"),
  authController.register
);

router.post(
  "/login",
  authAudit("USER_LOGIN"),
  authController.login
);

router.post(
  "/refresh",
  authAudit("TOKEN_REFRESH"),
  authController.refresh
);

router.post(
  "/logout",
  authController.logout
);

router.get(
  "/me",
  authController.me
);

export default router;