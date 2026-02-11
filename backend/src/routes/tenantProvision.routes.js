// routes/tenantProvision.routes.js
import { Router } from "express";
import { createTenantAndInvite } from "../controllers/tenantProvision.controller.js";

const router = Router();

/*
  POST /platform/tenants
  (protetto da x-platform-seed-key dentro al controller)
*/
router.post("/tenants", createTenantAndInvite);

export default router;
