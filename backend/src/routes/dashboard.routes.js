import express from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = express.Router();

/*
  GET /api/v1/dashboard/stats
  Statistiche dettagliate
*/
router.get("/stats", dashboardController.getStats);

export default router;