import Asset from "../models/Asset.js";

// Recupera tutti i beni attivi
export async function getAllActiveAssets() {
  return Asset.find({ active: true });
}

// Aggiorna ultimo controllo regolistico
export async function updateRuleCheck(assetId, date = new Date()) {
  return Asset.findByIdAndUpdate(assetId, {
    lastRuleCheck: date
  });
}

// Aggiorna ultimo controllo IA
export async function updateAICheck(assetId, date = new Date()) {
  return Asset.findByIdAndUpdate(assetId, {
    lastAICheck: date
  });
}

// Aggiorna risultato IA
export async function updateAIResult(assetId, { riskScore, confidence }) {
  return Asset.findByIdAndUpdate(assetId, {
    aiRiskScore: riskScore,
    aiConfidence: confidence
  });
}

// Aggiorna data ultima manutenzione
export async function updateLastMaintenance(assetId, date = new Date()) {
  return Asset.findByIdAndUpdate(assetId, {
    lastMaintenance: date
  });
}
