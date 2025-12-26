// prepara input per IA regolistica
export const buildRuleCheckPayload = (asset, rules, now) => ({
  asset_id: asset._id.toString(),
  lastMaintenance: asset.lastMaintenance,
  now: new Date(now).toISOString(),
  rules: rules.map(r => ({
    rule_id: r._id.toString(),
    name: r.name,
    frequency: r.frequency,
    priority: r.priority,
    interventionType: r.interventionType,
  })),
});
