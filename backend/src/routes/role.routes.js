import { Router } from "express";
import { createRole, listRoles, listPermissions } from "../controllers/role.controller.js";

const router = Router();

router.post("/roles", createRole);
router.get("/roles", listRoles);
router.get("/permissions", listPermissions);
router.delete("/roles/:id", deleteRole);

export default router;
