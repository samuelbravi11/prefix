import { getInterventionsQuery } from "../repositories/intervention.repository.js";
import { normalizeInterventionsForAI } from "../services/predictive.service.js";
import { callPythonPredictiveAI } from "../services/python.service.js";
import { createMaintenanceEvent } from "../services/event.service.js";
import { createAIResult } from "../repositories/airesult.repository.js";

/* AI PREDICTIVE JOB
  L'unità di lavoro specifica che deve essere eseguita al fine di effettuare una chiamata AI predittiva
*/
export const aiPredictiveCheckJob = async (asset, now) => {
  // recupero storico interventi
  const interventions = await getInterventionsQuery({
    buildingIds: [asset.buildingId],
    assetId: asset._id,
    period: null, // NESSUN filtro temporale → storico completo
  });
  console.log("STORICO INTERVENTI:\n", interventions);

  // se non ho uno storico esco --> nessun evento
  if (!interventions || interventions.length === 0) {
    return { triggered: false };
  }

  // normalizzazione storico interventi per IA
  const history = normalizeInterventionsForAI(interventions);
  console.log("STORICO INTERVENTI NORMALIZZATO:\n", history);

  // payload per Python
  const payload = {
    asset_id: asset._id.toString(),
    history: history,
    metadata: asset.metadata || {},
    now: new Date(now).toISOString(),
  };
  console.log("PAYLOAD TO PYTHON:\n", payload);

  // chiama il modello predittivo: Text Classification + Feature Extraction
  const response = await callPythonPredictiveAI(payload);
  console.log("RISPOSTA AI PREDITTIVA:\n", response);

  // push AIResult per le predizioni (sono un mago)
  const aiResult = await createAIResult({
    assetId: asset._id,
    buildingId: asset.buildingId,
    kind: "predictive_check",
    evaluatedAt: new Date(now),

    shouldCreateEvent: Boolean(response.shouldCreateEvent),
    riskScore: response.riskScore,
    confidence: response.confidence,
    riskLevel: response.riskLevel,
    explanation: response.explanation,

    meta: {
      historyCount: history.length,
      suggestedDate: response.suggestedDate,
    },
  });

  console.log("[AI] shouldCreateEvent:", response.shouldCreateEvent);
  console.log("[AI] suggestedDate:", response.suggestedDate);

  // se il rischio supera una certa soglia --> creo evento
  if (response.shouldCreateEvent) {
    await createMaintenanceEvent({
      assetId: asset._id,
      buildingId: asset.buildingId,
      reason: "ai_predictive",
      aiResultId: aiResult._id,

      // data suggerita direttamente dall’AI (manualmente)
      scheduledAt: response.suggestedDate
        ? new Date(response.suggestedDate)
        : null,

      data: {
        riskScore: response.riskScore,
        riskLevel: response.riskLevel,
        explanation: response.explanation,
        suggestedDate: response.suggestedDate,
      },
    });


    return { triggered: true };
  }

  return { triggered: false };
};
