import { schedulerConfig } from "../config/scheduler.config.js";
import { getActiveAssetsPage, updateRuleCheck, updateAICheck } from "../repositories/asset.repository.js";
import { ruleCheckJob } from "../jobs/ruleCheck.job.js";
import { aiPredictiveCheckJob } from "../jobs/aiPredictive.job.js";
import { shouldRunPredictiveCheck, shouldRunRuleCheck } from "./scheduler.utils.js";
import { mapLimit } from "../utils/mapLimit.js";

// Nota: lo scheduler automatico ha il suo flag interno; qui teniamo un lock separato
let manualRunning = false;

export function isSchedulerRunning() {
  return manualRunning;
}

async function scanAssets(ctx, handler) {
  const now = Date.now();
  const pageSize = Number(schedulerConfig.pageSize || 200);
  const concurrency = Number(schedulerConfig.concurrency || 10);

  let cursor = null;
  while (true) {
    const assets = await getActiveAssetsPage(ctx, { limit: pageSize, afterId: cursor });
    if (!assets.length) break;

    await mapLimit(assets, concurrency, async (asset) => handler(asset, now));

    cursor = assets[assets.length - 1]._id;
  }
}

/**
 * Esegue una singola passata di controllo regolistico sul tenant corrente.
 * Aggiorna lastRuleCheck anche se non viene triggerato un evento.
 */
export async function runRulesCheckOnce(ctx) {
  if (manualRunning) return;
  manualRunning = true;
  try {
    await scanAssets(ctx, async (asset, now) => {
      const shouldCheckRules = shouldRunRuleCheck(asset, now, schedulerConfig.ruleThreshold);
      if (!shouldCheckRules) return;

      await ruleCheckJob(ctx, asset, now);
      await updateRuleCheck(ctx, asset._id, new Date(now));
    });
  } finally {
    manualRunning = false;
  }
}

/**
 * Esegue una singola passata di controllo AI predittivo sul tenant corrente.
 * Aggiorna lastAICheck anche se non viene triggerato un evento.
 */
export async function runAICheckOnce(ctx) {
  if (manualRunning) return;
  manualRunning = true;
  try {
    await scanAssets(ctx, async (asset, now) => {
      const shouldCheckAI = shouldRunPredictiveCheck(asset, now, schedulerConfig.aiThreshold);
      if (!shouldCheckAI) return;

      await aiPredictiveCheckJob(ctx, asset, now);
      await updateAICheck(ctx, asset._id, new Date(now));
    });
  } finally {
    manualRunning = false;
  }
}
