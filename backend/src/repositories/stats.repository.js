// src/repositories/stats.repository.js
import mongoose from "mongoose";
import { Intervention } from "../models/Intervention.js";

/**
 * Cast safe a ObjectId (ignora id falsi).
 * Nota: in controller fai già validazione/403,
 * qui facciamo solo cast.
 */
function toObjectIds(ids) {
  return ids
    .map((id) => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Match base:
 * - buildingId in lista
 * - performedAt tra from e to
 */
function buildMatch({ buildingIds, from, to }) {
  return {
    buildingId: { $in: toObjectIds(buildingIds) },
    performedAt: { $gte: from, $lte: to },
  };
}

/**
 * GroupId per timeline bucket:
 * - month   -> YYYY-MM-DD (giorno)
 * - quarter -> ISO week (YYYY-Www)
 * - year    -> YYYY-MM (mese)
 */
function buildTimelineGroupId(period) {
  if (period === "month") {
    return {
      date: { $dateToString: { format: "%Y-%m-%d", date: "$performedAt" } },
    };
  }

  if (period === "year") {
    return {
      date: { $dateToString: { format: "%Y-%m", date: "$performedAt" } },
    };
  }

  // quarter -> settimana ISO
  return {
    isoYear: { $isoWeekYear: "$performedAt" },
    isoWeek: { $isoWeek: "$performedAt" },
  };
}

/**
 * Aggregazione stats:
 * - totals: conteggi globali (byType/bySeverity/total)
 * - timeline: bucketizzati in base al periodo
 */
export async function getInterventionsStatsAggregation({
  buildingIds,
  period,
  from,
  to,
}) {
  const matchStage = { $match: buildMatch({ buildingIds, from, to }) };
  const timelineGroupId = buildTimelineGroupId(period);

  const timelineGroupStage = {
    $group: {
      _id: timelineGroupId,

      total: { $sum: 1 },

      // byType
      maintenance: {
        $sum: { $cond: [{ $eq: ["$type", "maintenance"] }, 1, 0] },
      },
      inspection: {
        $sum: { $cond: [{ $eq: ["$type", "inspection"] }, 1, 0] },
      },
      failure: {
        $sum: { $cond: [{ $eq: ["$type", "failure"] }, 1, 0] },
      },
      repair: {
        $sum: { $cond: [{ $eq: ["$type", "repair"] }, 1, 0] },
      },

      // bySeverity
      low: { $sum: { $cond: [{ $eq: ["$severity", "low"] }, 1, 0] } },
      medium: { $sum: { $cond: [{ $eq: ["$severity", "medium"] }, 1, 0] } },
      high: { $sum: { $cond: [{ $eq: ["$severity", "high"] }, 1, 0] } },
    },
  };

  /**
   * Project timeline:
   * - month/year: _id.date è già stringa
   * - quarter: compongo "YYYY-Www"
   */
  const timelineProjectStage =
    period === "quarter"
      ? {
          $project: {
            _id: 0,
            date: {
              $concat: [
                { $toString: "$_id.isoYear" },
                "-W",
                {
                  $cond: [
                    { $lt: ["$_id.isoWeek", 10] },
                    { $concat: ["0", { $toString: "$_id.isoWeek" }] },
                    { $toString: "$_id.isoWeek" },
                  ],
                },
              ],
            },
            total: 1,
            byType: {
              maintenance: "$maintenance",
              inspection: "$inspection",
              repair: "$repair",
              failure: "$failure",
            },
            bySeverity: {
              low: "$low",
              medium: "$medium",
              high: "$high",
            },
          },
        }
      : {
          $project: {
            _id: 0,
            date: "$_id.date",
            total: 1,
            byType: {
              maintenance: "$maintenance",
              inspection: "$inspection",
              repair: "$repair",
              failure: "$failure",
            },
            bySeverity: {
              low: "$low",
              medium: "$medium",
              high: "$high",
            },
          },
        };

  const timelineSortStage = { $sort: { date: 1 } };

  const totalsGroupStage = {
    $group: {
      _id: null,
      total: { $sum: 1 },

      maintenance: {
        $sum: { $cond: [{ $eq: ["$type", "maintenance"] }, 1, 0] },
      },
      inspection: {
        $sum: { $cond: [{ $eq: ["$type", "inspection"] }, 1, 0] },
      },
      failure: { $sum: { $cond: [{ $eq: ["$type", "failure"] }, 1, 0] } },
      repair: { $sum: { $cond: [{ $eq: ["$type", "repair"] }, 1, 0] } },

      low: { $sum: { $cond: [{ $eq: ["$severity", "low"] }, 1, 0] } },
      medium: { $sum: { $cond: [{ $eq: ["$severity", "medium"] }, 1, 0] } },
      high: { $sum: { $cond: [{ $eq: ["$severity", "high"] }, 1, 0] } },
    },
  };

  const totalsProjectStage = {
    $project: {
      _id: 0,
      total: 1,
      byType: {
        maintenance: "$maintenance",
        inspection: "$inspection",
        repair: "$repair",
        failure: "$failure",
      },
      bySeverity: {
        low: "$low",
        medium: "$medium",
        high: "$high",
      },
    },
  };

  const pipeline = [
    matchStage,
    {
      $facet: {
        timeline: [timelineGroupStage, timelineProjectStage, timelineSortStage],
        totals: [totalsGroupStage, totalsProjectStage],
      },
    },
  ];

  const [result] = await Intervention.aggregate(pipeline);

  const totals = result?.totals?.[0] || {
    total: 0,
    byType: { maintenance: 0, inspection: 0, repair: 0, failure: 0 },
    bySeverity: { low: 0, medium: 0, high: 0 },
  };

  return { totals, timeline: result?.timeline || [] };
}
