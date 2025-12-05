import express from "express";
import * as userController from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// Applica il middleware di autenticazione a tutte le rotte definite in questo router
router.use(authMiddleware);

// Rotta per ottenere tutti gli utenti
router.get("/users", userController.getAllUsers);
router.post("/login", userController.login);
router.post("/register", userController.register);

export default router;