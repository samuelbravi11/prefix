// src/routes/intervention.routes.js
import express from "express";
import * as interventionController from "../controllers/intervention.controller.js";

const router = express.Router();

// --- tabellare (nuova) ---
router.get("/table", interventionController.getInterventionsTable);

// --- bulk upload (nuove) ---
router.post("/bulk/preview", interventionController.previewBulkInterventions);
router.post("/bulk/commit", interventionController.commitBulkInterventions);

// --- create singolo/multiplo (nuova) ---
router.post("/", interventionController.createInterventions);

/**
 * GET /api/v1/interventions
 * (già usato per calendario / storici)
 */
router.get("/", interventionController.getInterventions);

/**
 * GET /api/v1/interventions/:id
 */
router.get("/:id", interventionController.getInterventionById);

/**
 * DELETE /api/v1/interventions/:id
 */
router.delete("/:id", interventionController.deleteIntervention);


export default router;