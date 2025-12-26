export const normalizeInterventionsForAI = (interventions) => {
  return interventions.map((i) => ({
    type: i.type,
    outcome: i.outcome,
    severity: i.severity,
    performedAt: i.performedAt,
    durationMinutes: i.durationMinutes,
  }));
};
