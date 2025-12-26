import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
      index: true,
    },

    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
      index: true,
    },

    // motivo di creazione evento
    reason: {
      type: String,
      required: true, // "rule_based" | "ai_predictive"
      index: true,
    },

    // riferimento opzionale alla valutazione AI che l'ha generato
    aiResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Airesult",
    },

    // dati utili all’azione (snapshot)
    data: {
      type: Object,
      default: {},
      /*
        esempi:
        {
          dueRuleIds: [...],
          primaryRuleId: "...",
          riskScore: 0.82,
          explanation: "..."
        }
      */
    },

    scheduledAt: {
      type: Date,
      default: null,
      index: true,
    },

    status: {
      type: String,
      default: "pending",
      enum: ["pending", "scheduled", "completed", "cancelled"],
      index: true,
    },
  },
  { timestamps: true }
);

eventSchema.index({ assetId: 1, status: 1 });
eventSchema.index({ buildingId: 1, scheduledAt: 1 });

export default mongoose.model("Event", eventSchema);
