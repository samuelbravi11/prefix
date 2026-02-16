import { Router } from "express";
import { requirePlatformKey } from "../middleware/requirePlatformKey.js";
import * as tenantProvisionController from "../controllers/tenantProvision.controller.js";

const router = Router();

/*
  POST /platform/tenants
  (protetto da x-platform-seed-key dentro al controller)
  // SOLO TU (curl) puoi chiamare questo endpoint
*/
router.post("/tenants", requirePlatformKey, tenantProvisionController.createTenantAndInvite);

export default router;
