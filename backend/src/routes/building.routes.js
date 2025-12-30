import express from "express";
import * as buildingController from "../controllers/building.controller.js";

const router = express.Router();

/*
  GET /api/v1/buildings/myBuildings
  Edifici comunali a cui sono associato
*/
router.get("/", buildingController.getMyBuildings);

export default router;
