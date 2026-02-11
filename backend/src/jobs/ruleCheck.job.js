// src/jobs/ruleCheck.job.js
import { callPythonTableQA } from "../services/python.service.js";
import { createMaintenanceEvent } from "../services/event.service.js";
import { getRulesByAsset } from "../repositories/rule.repository.js";
import { buildRuleCheckPayload } from "../services/rule.service.js";
import { createAIResult } from "../repositories/airesult.repository.js";
import { computeScheduledAtForRule } from "../services/scheduling.service.js";

/* RULE JOB
  L'unità di lavoro specifica che deve essere eseguita al fine di effettuare un controllo regolistico
*/  // now --> momento in cui il sistema ha deciso di valutare questo bene
export const ruleCheckJob = async (ctx, asset, now) => {
  // se il bene non ha regole esco
  const rules = await getRulesByAsset(ctx, asset);
  if (!rules.length) return { triggered: false };
  
  // costruisco il paylod da mandare al servizio python
  const payload = buildRuleCheckPayload(asset, rules, now);
  console.log("PAYLOAD TO PYTHON:\n", payload);
  
  // chiama Table Question Answering sul server python e aspetto la risposta
  const response = await callPythonTableQA(payload);
  console.log("RISULTATO AI REGOLISTICA:\n", response);

  const dueRuleIds = response.dueRuleIds || [];

  // regola primaria (strategia semplice: prima)
  const primaryRuleId = dueRuleIds.length ? dueRuleIds[0] : null

  // salvo AIResult (VALUTAZIONE)
  const aiResult = await createAIResult(ctx, {
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
  });

  // se almeno una regola è scaduta → creo evento
  if (response.shouldCreateEvent) {
    const scheduledAt = computeScheduledAtForRule({
      evaluatedAt: new Date(now),
      windowDays: response.suggestedWindowDays ?? 7,
    });

    await createMaintenanceEvent(ctx, {
      assetId: asset._id,
      reason: "rule_based",
      scheduledAt,
      data: { dueRuleIds, primaryRuleId, explanation: response.explanation },
      aiResultId: aiResult._id,
    });

    return { triggered: true };
  }

  return { triggered: false };
};