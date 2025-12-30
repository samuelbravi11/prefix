// routes/intervention.routes.js
import express from "express";
import * as interventionController from "../controllers/intervention.controller.js";

const router = express.Router();

/*
  GET /api/v1/interventions
  Storico interventi
*/
router.get("/", interventionController.getInterventions);

/*
  GET /api/v1/interventions/:id
  Dettaglio intervento
*/
router.get("/:id", interventionController.getInterventionById);

export default router;
