// routes/event.routes.js
import express from "express";
import * as eventController from "../controllers/event.controller.js";

const router = express.Router();

/*
  GET /api/v1/events
  view=calendar | view=future (come nel tuo controller)
  buildingIds=csv (opzionale)
*/
router.get("/", eventController.getEvents);

/*
  TODO --> CI VA?
  GET /api/v1/events/stats
  Statistiche eventi (aggregazioni per grafici)
*/
router.get("/stats", eventController.getEventStats);

/*
  GET /api/v1/events/:id
*/
router.get("/:id", eventController.getEventById);


export default router;