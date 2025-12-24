import express from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead
} from "../controllers/notification.controller.js";

const router = express.Router();

/*
  PATCH /api/v1/notifications/:id/read
  Segna una notifica come letta
*/
router.patch("/:id/read", markNotificationAsRead);

/*
  PATCH /api/v1/notifications/read-all
  Segna tutte le notifiche come lette
*/
router.patch("/read-all", markAllAsRead);

/*
  GET /api/v1/notifications
  Recupera tutte le notifiche dell’utente loggato
*/
router.get("/", getUserNotifications);


export default router;