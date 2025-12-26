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
        "ERRORE_SERVIZIO"
      ]
    },

    // NOTIFICA SPECIFICA PER UTENTE
    recipient: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // Diventa opzionale
      },
      role: {
        type: String,
        required: false, // Diventa opzionale
        enum: ["admin_centrale", "admin_locale", "impresa", null]
      }
    },

    // ALTERNATIVA: NOTIFICA PER RUOLO + BUILDING
    targetRole: {
      type: String,
      enum: ["admin_centrale", "admin_locale", "impresa", null],
      default: null
    },
    
    targetBuildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      default: null
    },

    title: {
      type: String,
      required: true,
      maxlength: 100
    },

    message: {
      type: String,
      required: true,
      maxlength: 500
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],

    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: false
    }
  }
);

export default mongoose.model("Notification", NotificationSchema);