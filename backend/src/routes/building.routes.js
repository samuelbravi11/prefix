import express from "express";
import * as buildingController from "../controllers/building.controller.js";

const router = express.Router();

/*
  GET /api/v1/buildings
  Edifici a cui sono associato (comportamento già esistente)
*/
router.get("/", buildingController.getMyBuildings);

/*
  GET /api/v1/buildings/all
  Tutti gli edifici (per tabella "visualizza edifici")
  Supporta sorting e conteggi asset/regole
*/
router.get("/all", buildingController.getAllBuildings);

/*
  GET /api/v1/buildings/:id
  Dettaglio edificio (utile per edit / UI)
*/
router.get("/:id", buildingController.getBuildingById);

/*
  POST /api/v1/buildings
  Crea edificio (protetto via RBAC/proxy)
*/
router.post("/", buildingController.createBuilding);

/*
  PUT /api/v1/buildings/:id
  Modifica edificio (protetto via RBAC/proxy)
*/
router.put("/:id", buildingController.updateBuilding);

/*
  DELETE /api/v1/buildings/:id
  elimina edificio (protetto via RBAC/proxy)
*/
router.delete("/:id", buildingController.deleteBuilding);

export default router;
