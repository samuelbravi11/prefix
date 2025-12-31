import { Intervention } from "../models/Intervention.js";
import { getDateRange } from "../services/dateRanges.service.js";

export async function getInterventionsQuery({
  buildingIds,
  assetId,
  period
}) {
  console.log("[INTERVENTIONS QUERY] buildingIds:", buildingIds);
  console.log(
    "[INTERVENTIONS QUERY] casted:",
    buildingIds?.map(id => id.toString())
  );

  const filter = {
    buildingId: { $in: buildingIds }
  };

  // filtro per asset specifico (opzionale)
  if (assetId) {
    filter.assetId = assetId;
  }

  // filtro temporale (opzionale)
  if (period) {
    const { from, to } = getDateRange(period);
    filter.performedAt = { $gte: from, $lte: to };
  }

  return Intervention.find(filter)
    .sort({ performedAt: -1 })
    .lean();
}
