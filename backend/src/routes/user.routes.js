// routes/user.routes.js
import express from "express";
import * as userController from "../controllers/user.controller.js";
import assignUserRoleController from "../controllers/assignUserRole.controller.js";

const router = express.Router();

router.get("/", userController.getAllUsers);
router.get("/me", userController.getMe);

// parte di admin centrale
router.put("/users/:id/assign-role", assignUserRoleController);

export default router;
