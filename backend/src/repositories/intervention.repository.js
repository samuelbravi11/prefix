// src/repositories/intervention.repository.js
import mongoose from "mongoose";
import { getDateRange } from "../services/dateRanges.service.js";

/**
 * Query interventi (filtri combinabili):
 * - buildingIds (obbligatorio)
 * - assetId (opzionale)
 * - period (opzionale: month|quarter|year)
 */
export async function getInterventionsQuery(ctx, { buildingIds, assetId, period }) {
  const { Intervention } = ctx.models;

  const buildingObjectIds = (buildingIds || []).map((id) => new mongoose.Types.ObjectId(id));

  const filter = { buildingId: { $in: buildingObjectIds } };
  if (assetId) filter.assetId = new mongoose.Types.ObjectId(assetId);

  if (period) {
    const { from, to } = getDateRange(period);
    filter.performedAt = { $gte: from, $lte: to };
  }

  return Intervention.find(filter).sort({ performedAt: -1 }).lean();
}
