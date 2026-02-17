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

/**
 * Tabellare con paginazione/sort/range date
 */
export async function getInterventionsTableQuery(
  ctx,
  { buildingIds, assetId, assetIds, from, to, page, limit, sortBy, sortOrder }
) {
  const { Intervention } = ctx.models;

  const buildingObjectIds = buildingIds.map((id) => new mongoose.Types.ObjectId(id));

  const filter = { buildingId: { $in: buildingObjectIds } };

  // ✅ compat: assetId singolo
  if (assetId) filter.assetId = new mongoose.Types.ObjectId(assetId);

  // ✅ nuovo: assetIds multipli (se presenti, hanno priorità)
  if (Array.isArray(assetIds) && assetIds.length > 0) {
    const objIds = assetIds.map((id) => new mongoose.Types.ObjectId(id));
    filter.assetId = { $in: objIds };
  }

  if (from || to) {
    filter.performedAt = {};
    if (from) filter.performedAt.$gte = new Date(from);
    if (to) filter.performedAt.$lte = new Date(to);
  }

  const sortField = ["performedAt", "createdAt"].includes(sortBy) ? sortBy : "performedAt";
  const sortDir = sortOrder === "asc" ? 1 : -1;

  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    Intervention.countDocuments(filter),
    Intervention.find(filter)
      .sort({ [sortField]: sortDir, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate("assetId", "name")
      .populate("buildingId", "name")
      .lean(),
  ]);

  return { total, items };
}

/**
 * Inserimento singolo o multiplo
 */
export async function insertInterventions(ctx, docs) {
  const { Intervention } = ctx.models;
  if (Array.isArray(docs)) {
    return Intervention.insertMany(docs, { ordered: true });
  }
  const created = await Intervention.create(docs);
  return created;
}
