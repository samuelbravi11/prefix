import express from "express";
import * as requestController from "../controllers/request.controller.js";

const router = express.Router();

/*
  GET /api/v1/requests
  Lista di tutte le richieste (solo admin centrale)
*/
router.get("/", requestController.getAllRequests);

/*
  GET /api/v1/requests/:id
  Dettaglio richiesta
*/
router.get("/:id", requestController.getRequestById);

/*
  POST /api/v1/requests
  Creazione richiesta
*/
router.post("/", requestController.createRequest);

/*
  PUT /api/v1/requests/:id
  Aggiornamento richiesta
*/
router.put("/:id", requestController.updateRequest);

export default router;
