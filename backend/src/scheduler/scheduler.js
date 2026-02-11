// src/scheduler/scheduler.js
import { schedulerConfig } from "../config/scheduler.config.js";
import { listActiveTenants, buildCtxFromTenant } from "../utils/tenantModels.js";

import { getAllActiveAssets, updateRuleCheck, updateAICheck } from "../repositories/asset.repository.js";
import { ruleCheckJob } from "../jobs/ruleCheck.job.js";
import { aiPredictiveCheckJob } from "../jobs/aiPredictive.job.js";
import { shouldRunPredictiveCheck, shouldRunRuleCheck } from "./scheduler.utils.js";

/* Lo Scheduler
  E' il componente software che decide quando e come eseguire i Job.
  Avvia un loop temporizzato che:
  - non blocca il server
  - gira in background
  - sopravvive finché Node è attivo
*/

/* LOGICA CHIAMATE AI
  per ogni bene sul database:
  - prelevo dati riguardanti l'ultima chiamata regolistica
  - se lastRuleCheck supera una soglia di threshold effettuo un controllo regolistico (dove le regole sono definite dall'utente)
  - se il controllo ritorna NULL o se non esiste una regola per quel bene --> avvio una chiamata ad un altro modello AI per la predizione del prossimo evento di manutenzione
  - se almeno uno dei 2 ritorna l'evento --> creo evento calendario

  In questo modo definisco una gerarchia dove il controllo regolistico è il preferito e viene chiamato più spesso,
  Le chiamate AI predittive verranno fatte se il controllo regolistico non ha avuto successo e se la soglia ha superato il threshold molto più alto del threshold regolistico
*/
async function tickTenant(ctx) {
  const assets = await getAllActiveAssets(ctx);
  const now = Date.now();

  for (const asset of assets) {
    const shouldCheckRules = shouldRunRuleCheck(asset, now, schedulerConfig.ruleThreshold);

    if (shouldCheckRules) {
      const ruleResult = await ruleCheckJob(ctx, asset, now);
      await updateRuleCheck(ctx, asset._id, new Date(now));
      if (ruleResult.triggered) continue;
    }

    const shouldCheckAI = shouldRunPredictiveCheck(asset, now, schedulerConfig.aiThreshold);
    if (shouldCheckAI) {
      const aiResult = await aiPredictiveCheckJob(ctx, asset, now);
      await updateAICheck(ctx, asset._id, new Date(now));
      if (aiResult.triggered) {
        // evento creato nel job
      }
    }
  }
}

export const startScheduler = () => {
  console.log("[SCHEDULER] Started");

  setInterval(async () => {
    try {
      const tenants = await listActiveTenants();
      for (const t of tenants) {
        const ctx = await buildCtxFromTenant(t);
        await tickTenant(ctx);
      }
    } catch (err) {
      console.error("[SCHEDULER] Error:", err);
    }
  }, schedulerConfig.interval);
};