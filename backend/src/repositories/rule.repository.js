import { Rule } from "../models/Rule.js";

// Restituisce tutte le regole attive applicabili a un asset:
// - regole che citano esplicitamente l'asset
// - regole che citano il tipo di asset
export const getRulesByAsset = async (asset) => {
  if (!asset || !asset._id || !asset.assetTypeId) {
    throw new Error("Invalid asset passed to getRulesByAsset");
  }

  return Rule.find({
    isActive: true,
    $or: [
      { assetIds: asset._id },
      { assetTypeIds: asset.assetTypeId },
    ],
  }).lean();
};