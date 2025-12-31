/*
// routes/calendar.routes.js
import express from "express";
import * as calendarController from "../controllers/calendar.controller.js";

const router = express.Router();

/*
  GET /api/v1/calendar
  Eventi calendarizzati (PENDING / scheduledAt)
*/
router.get("/", calendarController.getCalendar);

export default router;
*/