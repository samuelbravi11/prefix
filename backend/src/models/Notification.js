// models/Notification.js (schema)
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        // legacy (v1)
        "PROMEMORIA_INTERVENTO",
        "REPORT_DISPONIBILE",
        "REGISTRAZIONE_UTENTE",
        "ATTIVAZIONE_UTENTE",
        "CREAZIONE_INTERVENTO",
        "CANCELLAZIONE_INTERVENTO",
        "ERRORE_SERVIZIO",

        // v2 (frontend centro notifiche)
        "building_request",
        "building_assignment",
        "rule_triggered",
        "ai_alert",
        "intervention",
        "system",
      ],
    },

    // SOLO destinatario specifico (per-user)
    recipient: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    },

    // opzionale: scope edificio (utile per UI filtri)
    targetBuildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      default: null,
      index: true,
    },

    title: { type: String, required: true, maxlength: 100 },
    message: { type: String, required: true, maxlength: 500 },

    // severity per UI (default info)
    severity: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },

    relatedEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
      index: true,
    },

    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null }, // più semplice di readBy se è “solo per-user”

    // archiviazione (v2)
    archived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },

    // payload libero per dettagli UI
    data: { type: mongoose.Schema.Types.Mixed, default: null },

    // collegamento entità (opzionale)
    entity: {
      type: {
        type: String,
        default: null,
        maxlength: 50,
      },
      id: {
        type: String,
        default: null,
        maxlength: 64,
      },
      name: {
        type: String,
        default: null,
        maxlength: 120,
      },
    },

    // CTA opzionale
    action: {
      label: { type: String, default: null, maxlength: 60 },
      route: { type: String, default: null, maxlength: 200 },
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

// indici utili
NotificationSchema.index({ "recipient.userId": 1, createdAt: -1 });
NotificationSchema.index({ "recipient.userId": 1, read: 1, createdAt: -1 });
NotificationSchema.index({ "recipient.userId": 1, archived: 1, createdAt: -1 });
NotificationSchema.index({ "recipient.userId": 1, severity: 1, createdAt: -1 });

export { NotificationSchema };
