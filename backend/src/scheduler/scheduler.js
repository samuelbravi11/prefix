// src/scheduler/scheduler.js
import { schedulerConfig } from "../config/scheduler.config.js";
import { getActiveAssetsPage, updateRuleCheck, updateAICheck } from "../repositories/asset.repository.js";
import { ruleCheckJob } from "../jobs/ruleCheck.job.js";
import { aiPredictiveCheckJob } from "../jobs/aiPredictive.job.js";
import { shouldRunPredictiveCheck, shouldRunRuleCheck } from "./scheduler.utils.js";
import { mapLimit } from "../utils/mapLimit.js";
import { buildCtxFromTenant, listActiveTenants } from "../utils/tenantModels.js";

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
let running = false;

export function startScheduler() {
  console.log("[SCHEDULER] Started");

  const tick = async () => {
    if (running) {
      console.warn("[SCHEDULER] Tick skipped (still running)");
      return;
    }

    running = true;
    const startedAt = Date.now();

    try {
      console.log("[SCHEDULER] Tick begin");

      const tenants = await listActiveTenants();
      for (const t of tenants) {
        const ctx = await buildCtxFromTenant(t);
        await tickTenant(ctx);
      }

      console.log("[SCHEDULER] Tick end", { ms: Date.now() - startedAt });
    } catch (err) {
      console.error("[SCHEDULER] Tick error:", err);
    } finally {
      running = false;
      setTimeout(tick, schedulerConfig.interval);
    }
  };

  // primo avvio dopo interval
  setTimeout(tick, schedulerConfig.interval);
}

async function tickTenant(ctx) {
  const now = Date.now();
  const pageSize = Number(schedulerConfig.pageSize || 200);
  const concurrency = Number(schedulerConfig.concurrency || 10);

  let cursor = null;
  while (true) {
    const assets = await getActiveAssetsPage(ctx, { limit: pageSize, afterId: cursor });
    if (!assets.length) break;

    await mapLimit(assets, concurrency, async (asset) => {
      const shouldCheckRules = shouldRunRuleCheck(asset, now, schedulerConfig.ruleThreshold);
      if (shouldCheckRules) {
        const ruleResult = await ruleCheckJob(ctx, asset, now);
        await updateRuleCheck(ctx, asset._id, new Date(now));
        if (ruleResult?.triggered) return;
      }

      const shouldCheckAI = shouldRunPredictiveCheck(asset, now, schedulerConfig.aiThreshold);
      if (shouldCheckAI) {
        const aiResult = await aiPredictiveCheckJob(ctx, asset, now);
        await updateAICheck(ctx, asset._id, new Date(now));
        if (aiResult?.triggered) return;
      }
    });

    cursor = assets[assets.length - 1]._id;
  }
}