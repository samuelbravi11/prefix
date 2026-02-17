// routes/user.routes.js
import express from "express";

import * as userController from "../controllers/user.controller.js";
import * as userAssignment from "../controllers/userAssignment.controller.js";

const router = express.Router();

// GET /api/v1/users/me
router.get("/me", userController.getMe);

// ricerca utenti per "Informazioni utenti"
router.get("/search", userController.searchUsers);

// GET /api/v1/users/pending
router.get("/pending", userController.getPendingUsers);

// GET /api/v1/users/buildings?missing=true
router.get("/buildings", userController.getUsersBuildings);

// GET /api/v1/users
router.get("/", userController.getManagedUsers);

// PATCH /api/v1/users/:id/approve
router.patch("/:id/approve", userController.approvePendingUser);

// PATCH /api/v1/users/:id/role
router.patch("/:id/role", userController.updateUserRole);

// PATCH /api/v1/users/:id/status
router.patch("/:id/status", userController.updateUserStatus);

// PATCH /api/v1/users/:id/buildings
router.patch("/:id/buildings", userController.updateUserBuildings);

// PUT /api/v1/users/:id/assign-role
router.put("/:id/assign-role", userAssignment.assignUserRole);

// PUT /api/v1/users/:id/assign-buildings
router.put("/:id/assign-buildings", userAssignment.assignUserBuildings);

export default router;
