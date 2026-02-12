// src/repositories/asset.repository.js
import mongoose from "mongoose";
import { getTenantModels } from "../utils/tenantModels.js";

/**
 * Ritorna una pagina di asset attivi in ordine per _id (cursor pagination).
 */
export async function getActiveAssetsPage(reqOrCtx, { limit = 200, afterId = null } = {}) {
  const models = reqOrCtx?.models ? reqOrCtx.models : getTenantModels(reqOrCtx);
  const { Asset } = models;

  const filter = { isActive: true };
  if (afterId) {
    filter._id = { $gt: new mongoose.Types.ObjectId(afterId) };
  }

  return Asset.find(filter)
    .select("_id buildingId assetTypeId lastRuleCheck lastAICheck lastMaintenance metadata isActive")
    .sort({ _id: 1 })
    .limit(limit)
    .lean();
}

// Aggiorna ultimo controllo regolistico
export async function updateRuleCheck(reqOrCtx, assetId, date = new Date()) {
  const models = reqOrCtx?.models ? reqOrCtx.models : getTenantModels(reqOrCtx);
  const { Asset } = models;
  return Asset.findByIdAndUpdate(assetId, { lastRuleCheck: date }, { new: true }).lean();
}

// Aggiorna ultimo controllo IA
export async function updateAICheck(reqOrCtx, assetId, date = new Date()) {
  const models = reqOrCtx?.models ? reqOrCtx.models : getTenantModels(reqOrCtx);
  const { Asset } = models;
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