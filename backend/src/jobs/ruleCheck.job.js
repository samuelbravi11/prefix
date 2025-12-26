import { callPythonTableQA } from '../services/python.service.js'
import { createMaintenanceEvent } from '../services/event.service.js'
import { getRulesByAsset } from "../repositories/rule.repository.js";
import { buildRuleCheckPayload } from "../services/rule.service.js"
import { createAIResult } from "../repositories/airesult.repository.js";

/* RULE JOB
  L'unità di lavoro specifica che deve essere eseguita al fine di effettuare un controllo regolistico
*/  // now --> momento in cui il sistema ha deciso di valutare questo bene
export const ruleCheckJob = async (asset, now) => {
  const rules = await getRulesByAsset(asset);
  console.log("RULES:\n", rules)
  // se il bene non ha regole esco
  if (!rules.length) return { triggered: false };

  // costruisco il paylod da mandare al servizio python
  const payload = buildRuleCheckPayload(asset, rules, now);
  console.log("PAYLOAD TO PYTHON:\n", payload);
  
  // chiama Table Question Answering sul server python e aspetto la risposta
  const response = await callPythonTableQA(payload);
  console.log("RISULTATO AI REGOLISTICA:\n", response);

  const dueRuleIds = response.dueRuleIds || []

  // regola primaria (strategia semplice: prima)
  const primaryRuleId = dueRuleIds.length ? dueRuleIds[0] : null

  // salvo AIResult (VALUTAZIONE)
  const aiResult = await createAIResult({
    assetId: asset._id,
    buildingId: asset.buildingId,
    kind: "rule_check",
    evaluatedAt: new Date(now),

    shouldCreateEvent: Boolean(response.shouldCreateEvent),

    dueRuleIds,
    primaryRuleId,

    reason: response.reason,
    explanation: response.explanation,
    model: response.model,

    meta: {
      rulesCount: rules.length,
      dueRulesCount: dueRuleIds.length,
    },
  })

  // se almeno una regola è scaduta → creo evento
  if (response.shouldCreateEvent) {
    await createMaintenanceEvent({
      assetId: asset._id,
      buildingId: asset.buildingId,
      reason: "rule_based",

      // snapshot utile all’evento
      data: {
        dueRuleIds,
        primaryRuleId,
        explanation: response.explanation,
      },

      // collegamento diretto alla valutazione
      aiResultId: aiResult._id,
    })

    return { triggered: true };
  }

  return { triggered: false };
};