// src/config/scheduler.config.js
export const schedulerConfig = {
  interval: Number(process.env.SCHEDULER_INTERVAL_MS) || 60000,        // 1 minuto
  ruleThreshold: Number(process.env.RULE_CHECK_THRESHOLD_MS) || 86400000, // 24 ore
  aiThreshold: Number(process.env.AI_CHECK_THRESHOLD_MS) || 259200000,    // 3 giorni
  pageSize: Number(process.env.SCHEDULER_PAGE_SIZE) || 200,
  concurrency: Number(process.env.SCHEDULER_CONCURRENCY) || 10,
};