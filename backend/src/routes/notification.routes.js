import express from "express";
import {
  getUserNotifications,
  getUnreadCount,
  patchNotification,
  bulkMarkRead,
  bulkArchive,
  bulkDelete,
  deleteNotification,
  markNotificationAsRead,
  markAllAsRead
} from "../controllers/notification.controller.js";

const router = express.Router();

/*
  GET /api/v1/notifications
  Recupera tutte le notifiche dell’utente loggato
*/
router.get("/", getUserNotifications);

// count
router.get("/unread-count", getUnreadCount);

// single update (v2)
router.patch("/:id", patchNotification);

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

// bulk (v2)
router.post("/bulk/mark-read", bulkMarkRead);
router.post("/bulk/archive", bulkArchive);
router.post("/bulk/delete", bulkDelete);

// delete one (v2)
router.delete("/:id", deleteNotification);


export default router;
