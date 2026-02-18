import { Router } from "express";
import { triggerRulesCheck, triggerAICheck } from "../controllers/scheduler.controller.js";

const router = Router();

router.post("/trigger/rules-check", triggerRulesCheck);
router.post("/trigger/ai-check", triggerAICheck);

export default router;
