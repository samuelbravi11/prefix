// src/routes/intervention.routes.js
import express from "express";
import * as interventionController from "../controllers/intervention.controller.js";

const router = express.Router();

/**
 * GET /api/v1/interventions
 *
 * Query params (tutti opzionali):
 * - buildingIds=ID1,ID2,ID3  (CSV)   -> filtra per uno o più edifici
 * - period=month|quarter|year         -> filtra per periodo temporale
 * - assetId=<assetObjectId>           -> filtra per uno specifico asset
 *
 * Se buildingIds NON è presente -> default: tutti gli edifici associati all’utente
 *
 * Sicurezza:
 * - Se l’utente passa buildingIds non associati a req.user.buildingIds -> 403
 */
router.get("/", interventionController.getInterventions);

/**
 * GET /api/v1/interventions/:id
 *
 * Path param:
 * - id -> ObjectId dell’intervento
 *
 * Sicurezza:
 * - L’intervento viene restituito solo se buildingId dell’intervento
 *   è dentro req.user.buildingIds
 */
router.get("/:id", interventionController.getInterventionById);

export default router;
