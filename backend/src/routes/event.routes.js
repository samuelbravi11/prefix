// routes/event.routes.js
import express from "express";
import * as eventController from "../controllers/event.controller.js";

const router = express.Router();

/*
  GET /api/v1/events
  Restituisce tutti gli eventi visibili all’utente
*/
router.get("/", eventController.getEvents);

/*
  GET /api/v1/events/:id
  Restituisce il dettaglio di un evento
*/
router.get("/:id", eventController.getEventById);

export default router;
