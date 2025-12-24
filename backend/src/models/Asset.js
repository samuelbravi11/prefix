import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    // IDENTITÀ DEL BENE
    name: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true
      // es: "ESTINTORE", "IMPIANTO_TERMICO"
    },

    manufacturerModel: {
      type: String
    },

    serialNumber: {
      type: String,
      unique: true,
      sparse: true
    },

    location: {
      type: String
      // es: "Locale caldaie", "Corridoio piano 2"
    },

    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true
    },

    // STATO
    active: {
      type: Boolean,
      default: true
    },

    // CONTROLLI AUTOMATICI
    lastRuleCheck: {
      type: Date,
      default: null
    },

    lastAICheck: {
      type: Date,
      default: null
    },

    lastMaintenance: {
      type: Date,
      default: null
    },

    // METADATI IA
    aiRiskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },

    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Asset", assetSchema);
