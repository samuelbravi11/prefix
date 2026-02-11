// models/Notification.js (schema)
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "PROMEMORIA_INTERVENTO",
        "REPORT_DISPONIBILE",
        "REGISTRAZIONE_UTENTE",
        "ATTIVAZIONE_UTENTE",
        "CREAZIONE_INTERVENTO",
        "CANCELLAZIONE_INTERVENTO",
        "ERRORE_SERVIZIO",
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
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

// indici utili
NotificationSchema.index({ "recipient.userId": 1, createdAt: -1 });
NotificationSchema.index({ "recipient.userId": 1, read: 1, createdAt: -1 });

export { NotificationSchema };
