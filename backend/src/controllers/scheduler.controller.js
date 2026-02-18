import { schedulerConfig } from "../config/scheduler.config.js";
import { buildCtxFromReq } from "../utils/tenantModels.js";
import { getActiveAssetsPage, updateRuleCheck, updateAICheck } from "../repositories/asset.repository.js";
import { ruleCheckJob } from "../jobs/ruleCheck.job.js";
import { aiPredictiveCheckJob } from "../jobs/aiPredictive.job.js";
import { shouldRunPredictiveCheck, shouldRunRuleCheck } from "../scheduler/scheduler.utils.js";
import { mapLimit } from "../utils/mapLimit.js";

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

async function runTenantOnce({ ctx, kind, force = false, maxAssets = 500 }) {
  const now = Date.now();
  const pageSize = Math.min(200, Number(schedulerConfig.pageSize || 200));
  const concurrency = Math.min(10, Number(schedulerConfig.concurrency || 10));

  let processed = 0;
  let triggered = 0;

  let cursor = null;
  while (true) {
    const remaining = maxAssets - processed;
    if (remaining <= 0) break;

    const assets = await getActiveAssetsPage(ctx, { limit: Math.min(pageSize, remaining), afterId: cursor });
    if (!assets.length) break;

    await mapLimit(assets, concurrency, async (asset) => {
      if (kind === "rules") {
        const shouldRun = force || shouldRunRuleCheck(asset, now, schedulerConfig.ruleThreshold);
        if (!shouldRun) return;
        const r = await ruleCheckJob(ctx, asset, now);
        await updateRuleCheck(ctx, asset._id, new Date(now));
        processed += 1;
        if (r?.triggered) triggered += 1;
        return;
      }

      if (kind === "ai") {
        const shouldRun = force || shouldRunPredictiveCheck(asset, now, schedulerConfig.aiThreshold);
        if (!shouldRun) return;
        const r = await aiPredictiveCheckJob(ctx, asset, now);
        await updateAICheck(ctx, asset._id, new Date(now));
        processed += 1;
        if (r?.triggered) triggered += 1;
      }
    });

    cursor = assets[assets.length - 1]._id;
  }

  return { processed, triggered };
}

/**
 * POST /api/v1/scheduler/trigger/rules-check
 * Body/query:
 * - force: boolean (default false) -> ignora threshold
 * - maxAssets: number (default 500)
 */
export async function triggerRulesCheck(req, res) {
  try {
    const ctx = await buildCtxFromReq(req);
    const force = String(req.body?.force ?? req.query?.force ?? "false") === "true";
    const maxAssets = Math.min(2000, toInt(req.body?.maxAssets ?? req.query?.maxAssets, 500));

    const result = await runTenantOnce({ ctx, kind: "rules", force, maxAssets });
    return res.json({ ok: true, kind: "rules", ...result });
  } catch (err) {
    return res.status(500).json({ message: "Errore trigger regole", error: err.message });
  }
}

/**
 * POST /api/v1/scheduler/trigger/ai-check
 */
export async function triggerAICheck(req, res) {
  try {
    const ctx = await buildCtxFromReq(req);
    const force = String(req.body?.force ?? req.query?.force ?? "false") === "true";
    const maxAssets = Math.min(2000, toInt(req.body?.maxAssets ?? req.query?.maxAssets, 500));

    const result = await runTenantOnce({ ctx, kind: "ai", force, maxAssets });
    return res.json({ ok: true, kind: "ai", ...result });
  } catch (err) {
    return res.status(500).json({ message: "Errore trigger AI", error: err.message });
  }
}
