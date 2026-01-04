// routes/event.routes.js
import express from "express";
import * as eventController from "../controllers/event.controller.js";

const router = express.Router();

/*
  GET /api/v1/events/stats
  Statistiche eventi (aggregazioni per grafici)
*/
router.get("/stats", eventController.getEventStats);

/*
GET /api/v1/events
Lista eventi (con filtri query)
*/
router.get("/", eventController.getEvents);

/*
GET /api/v1/events/:id
Dettaglio evento
*/
router.get("/:id", eventController.getEventById);


export default router;