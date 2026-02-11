import mongoose from "mongoose";

const RuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    trim: true,
  },

  // bene generico (estintori in generale) oppure specifico (caldaia piano 2)
  isGeneric: {
    type: Boolean,
    default: false,
  },

  // ---------- FREQUENZA ----------
  frequency: {
    value: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      required: true,
      enum: ["days", "weeks", "months", "years"],
    },
  },

  // ---------- APPLICABILITÀ ----------
  // Lista esplicita di asset
  assetIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
    },
  ],

  // Lista di tipi di asset (es. estintori)
  assetTypeIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssetType",
    },
  ],

  // ---------- METADATI ----------
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },

  interventionType: {
    type: String,
    trim: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
},
{
  timestamps: true, // createdAt / updatedAt
});

export { RuleSchema };
// export const Rule = mongoose.model("Rule", RuleSchema);