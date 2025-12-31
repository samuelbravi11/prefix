import express from "express";
import * as interventionController from "../controllers/intervention.controller.js";

const router = express.Router();

/*
────────────────────────────────────────────────────────
 GET /api/v1/interventions
────────────────────────────────────────────────────────
 Restituisce lo storico degli interventi visibili all’utente.

 Query params (opzionali):
 - period=month|quarter|year
   → filtra per finestra temporale
 - assetId=<ObjectId>
   → filtra per asset specifico

 Esempi:
 - /interventions
   → tutti gli interventi
 - /interventions?period=year
   → interventi ultimo anno
 - /interventions?assetId=123
   → storico completo asset
 - /interventions?assetId=123&period=month
   → ultimo mese per asset
*/
router.get("/", interventionController.getInterventions);

/*
────────────────────────────────────────────────────────
 GET /api/v1/interventions/:id
────────────────────────────────────────────────────────
 Restituisce il dettaglio di un singolo intervento.
*/
router.get("/:id", interventionController.getInterventionById);

export default router;
