import { callPythonPredictiveAI } from '../services/python.service.js'
import { createMaintenanceEvent } from '../services/event.service.js'
import { updateAICheck, updateAIResult } from "../repositories/asset.repository.js";

/* AI PREDICTIVE JOB
  L'unità di lavoro specifica che deve essere eseguita al fine di effettuare una chiamata AI predittiva
*/
export const aiPredictiveCheckJob = async (asset) => {
  // chiama il modello predittivo: Text Classification + Feature Extraction
  const response = await callPythonPredictiveAI({
    // input: storico + feature tecniche
    history: asset.history,
    metadata: asset.metadata,
  });

  await updateAIResult(asset._id, {
    riskScore: response.riskScore,
    confidence: response.confidence,
  });

  await updateAICheck(asset._id);

  // se il rischio supera una certa soglia --> creo evento
  if (response.shouldCreateEvent) {
    await createMaintenanceEvent({
      assetId: asset._id,
      reason: "AI_PREDICTIVE",
      data: response,
    });

    return { triggered: true };
  }

  return { triggered: false };
};
