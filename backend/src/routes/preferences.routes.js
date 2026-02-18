import { Router } from "express";
import { getMyPreferences, updateMyPreferences } from "../controllers/preferences.controller.js";

const router = Router();

router.get("/me", getMyPreferences);
router.put("/me", updateMyPreferences);

export default router;
