// src/repositories/intervention.repository.js
import mongoose from "mongoose";
import { Intervention } from "../models/Intervention.js";
import { getDateRange } from "../services/dateRanges.service.js";

/**
 * Query interventi (filtri combinabili):
 * - buildingIds (obbligatorio, già validato dal controller)
 * - assetId (opzionale)
 * - period (opzionale: month|quarter|year)
 */
export async function getInterventionsQuery({ buildingIds, assetId, period }) {
  // NB: qui CASTO a ObjectId in modo robusto
  const buildingObjectIds = (buildingIds || []).map((id) => new mongoose.Types.ObjectId(id));

  const filter = {
    buildingId: { $in: buildingObjectIds },
  };

  // filtro per asset specifico (opzionale)
  if (assetId) {
    filter.assetId = new mongoose.Types.ObjectId(assetId);
  }

  // filtro temporale (opzionale)
  if (period) {
    const { from, to } = getDateRange(period);
    filter.performedAt = { $gte: from, $lte: to };
  }

  // sort: più recenti prima
  return Intervention.find(filter)
    .sort({ performedAt: -1 })
    .lean();
}
