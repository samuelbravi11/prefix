import { Intervention } from "../models/Intervention.js";

// Restituisce lo storico COMPLETO degli interventi di un asset,
// ordinato dal più recente al più vecchio.
export const getAllInterventionsByAsset = async (asset) => {
  if (!asset || !asset._id) {
    throw new Error("Invalid asset passed to getAllInterventionsByAsset");
  }

  return Intervention.find({
    assetId: asset._id,
  })
    .sort({ performedAt: -1 })
    .lean();
};
