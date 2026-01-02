import mongoose from "mongoose"
import { Intervention } from "../models/Intervention.js";
import { getDateRange } from "../services/dateRanges.service.js";

export async function getInterventionsQuery({
  buildingIds,
  buildingId,
  assetId,
  period
}) {
  console.log("[INTERVENTIONS QUERY] buildingIds:", buildingIds);
  console.log(
    "[INTERVENTIONS QUERY] casted:",
    buildingIds?.map(id => id.toString())
  );
  
  const castedBuildingIds = buildingIds.map(id =>
    typeof id === "string" ? new mongoose.Types.ObjectId(id) : id
  );

  const filter = {
    buildingId: { $in: castedBuildingIds }
  };

  if (buildingId) {
    filter.buildingId = buildingId;
  }

  if (assetId) {
    filter.assetId = new mongoose.Types.ObjectId(assetId);
  }

  if (period) {
    const { from, to } = getDateRange(period);
    filter.performedAt = { $gte: from, $lte: to };
  }

  return Intervention.find(filter)
    .sort({ performedAt: -1 })
    .lean();
}

