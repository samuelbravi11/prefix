import {
  getAllActiveAssets,
  updateRuleCheck,
  updateAICheck,
  updateAIResult
} from "../repositories/asset.repository.js";

export async function processAssetRuleCheck(asset) {
  // logica applicativa
  await updateRuleCheck(asset._id);
}

export async function processAIResult(assetId, aiResult) {
  await updateAIResult(assetId, aiResult);
  await updateAICheck(assetId);
}