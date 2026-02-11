import mongoose from "mongoose";

const AssetSchema = new mongoose.Schema({
  // IDENTITÀ
  name: {
    type: String,
    required: true,
    trim: true,
  },

  // true = asset generico (es. "Estintori")
  // false = asset singolo (es. "Estintore Piano 1")
  isGeneric: {
    type: Boolean,
    default: false,
  },

  // EDIFICIO DI APPARTENENZA
  buildingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Building",
    required: true,
  },

  // CATEGORIA / TIPO ASSET (Antincendio, Climatizzazione, ecc.)
  assetTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MaintenanceCategory",
    required: true,
  },

  // METADATI LIBERI (dipendono dal tipo di asset)
  // es:
  // - location
  // - model
  // - powerKw
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // STATO
  isActive: {
    type: Boolean,
    default: true,
  },

  // DATA ULTIMA MANUTENZIONE EFFETTIVA
  // (valida sia per asset singolo che per asset group)
  lastMaintenance: {
    type: Date,
    default: null,
  },

  // ─────────────────────────────
  // CONTROLLI AUTOMATICI (scheduler)
  // ─────────────────────────────

  // ultima valutazione regolistica
  lastRuleCheck: {
    type: Date,
    default: null,
  },

  // ultima valutazione IA predittiva
  lastAICheck: {
    type: Date,
    default: null,
  },
},
{
  timestamps: true, // createdAt / updatedAt
});

// export default mongoose.model("Asset", AssetSchema);
export { AssetSchema };