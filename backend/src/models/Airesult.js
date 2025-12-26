import mongoose from "mongoose";

const AiresultSchema = new mongoose.Schema(
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
      index: true,
    },

    // tipo di valutazione
    kind: {
      type: String,
      required: true,
      enum: ["rule_check", "predictive_check"],
      index: true,
    },

    // timestamp della valutazione (scheduler now)
    evaluatedAt: {
      type: Date,
      required: true,
      index: true,
    },

    // esito minimo comune
    shouldCreateEvent: {
      type: Boolean,
      required: true,
    },

    // ---------- PREDITTIVA ----------
    riskScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
    },

    // ---------- REGOLE ----------
    // tutte le regole scadute in quel momento
    dueRuleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rule",
      },
    ],

/*
    // opzionale: regola “principale” scelta dal backend
    primaryRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rule",
    },
*/
    reason: {
      type: String,
      trim: true,
    },

    explanation: {
      type: String,
      trim: true,
    },

    // info sul modello (audit/debug)
    model: {
      name: { type: String, trim: true },
      revision: { type: String, trim: true },
    },

    // extra info (conteggi, feature, ecc.)
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// indici utili
AiresultSchema.index({ assetId: 1, kind: 1, evaluatedAt: -1 });
AiresultSchema.index({ kind: 1, evaluatedAt: -1 });

export const Airesult = mongoose.model("Airesult", AiresultSchema);
