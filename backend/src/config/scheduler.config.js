export const schedulerConfig = {
  interval: Number(process.env.SCHEDULER_INTERVAL_MS),
  ruleThreshold: Number(process.env.RULE_CHECK_THRESHOLD_MS),
  aiThreshold: Number(process.env.AI_CHECK_THRESHOLD_MS),
}
