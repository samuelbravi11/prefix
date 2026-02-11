// src/repositories/asset.repository.js

// Recupera tutti i beni attivi
export async function getAllActiveAssets(ctx) {
  const { Asset } = ctx.models;
  return Asset.find({ isActive: true }).lean();
}

// Aggiorna ultimo controllo regolistico
export async function updateRuleCheck(ctx, assetId, date = new Date()) {
  const { Asset } = ctx.models;
  return Asset.findByIdAndUpdate(assetId, { lastRuleCheck: date }, { new: true }).lean();
}

// Aggiorna ultimo controllo IA
export async function updateAICheck(ctx, assetId, date = new Date()) {
  const { Asset } = ctx.models;
  return Asset.findByIdAndUpdate(assetId, { lastAICheck: date }, { new: true }).lean();
}

// Aggiorna risultato IA
export async function updateAIResult(ctx, assetId, { riskScore, confidence }) {
  const { Asset } = ctx.models;
  return Asset.findByIdAndUpdate(
    assetId,
    { aiRiskScore: riskScore, aiConfidence: confidence },
    { new: true }
  ).lean();
}

// Aggiorna data ultima manutenzione
export async function updateLastMaintenance(ctx, assetId, date = new Date()) {
  const { Asset } = ctx.models;
  return Asset.findByIdAndUpdate(assetId, { lastMaintenance: date }, { new: true }).lean();
}
