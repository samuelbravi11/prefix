import express from "express";
import * as userController from "../controllers/user.controller.js";
import authMiddleware from "../middleware/authGuard.middleware.js";

const router = express.Router();

// Applica il middleware di autenticazione a tutte le rotte definite in questo router
router.use(authMiddleware);

// Rotta per ottenere tutti gli utenti
router.get("/users", userController.getAllUsers);
router.get("/me", userController.getMe);

export default router;