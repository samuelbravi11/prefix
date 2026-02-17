import express from "express";
import * as ruleController from "../controllers/rule.controller.js";

const router = express.Router();

router.get("/", ruleController.listRules);
router.post("/", ruleController.createRule);
router.put("/:id", ruleController.updateRule);
router.delete("/:id", ruleController.deleteRule);

export default router;
