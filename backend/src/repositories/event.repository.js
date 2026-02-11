// src/repositories/event.repository.js
import mongoose from "mongoose";
import { getTenantModels } from "../utils/tenantModels.js";

/*
  Calcola l'elenco di buildingIds richiesti dal client.
  Supporta:
  - ?buildingId=...
  - ?buildingIds[]=...&buildingIds[]=...
*/
export function parseRequestedBuildingIds(query) {
  const { buildingId, buildingIds } = query || {};

  const ids = [];
  if (buildingId) ids.push(buildingId);

  if (Array.isArray(buildingIds)) ids.push(...buildingIds);
  else if (typeof buildingIds === "string") ids.push(buildingIds);

  return [...new Set(ids.map(String))].filter(Boolean);
}

/*
  Confronta edifici richiesti con edifici autorizzati.
  - Se requestedBuildingIds è vuoto -> allowed = tutti quelli dell'utente
  - Se chiede un building fuori lista -> forbidden
*/
export function resolveAllowedBuildingIds({ userBuildingIds = [], requestedBuildingIds = [] }) {
  const userIds = (userBuildingIds || []).map(String);

  if (!requestedBuildingIds.length) {
    return { forbidden: false, allowed: userIds };
  }

  const userSet = new Set(userIds);
  const requested = requestedBuildingIds.map(String);

  for (const id of requested) {
    if (!userSet.has(id)) return { forbidden: true, allowed: [] };
  }

  return { forbidden: false, allowed: requested };
}

/**
 * Trova eventi tenant-aware.
 */
export async function findEvents(req, { buildingIds = [], type, future, from, to }) {
  const { Event } = getTenantModels(req);

  const filter = {
    buildingId: { $in: buildingIds.map((id) => new mongoose.Types.ObjectId(id)) },
  };

  // calendar view → solo quelli schedulati
  if (type === "calendar") {
    filter.scheduledAt = { $ne: null };
  }

  // future → scheduledAt >= now
  if (future === true) {
    filter.scheduledAt = { $ne: null, $gte: new Date() };
  }

  // filtri data: scheduledAt se calendar/future, altrimenti createdAt
  const useScheduled = type === "calendar" || future === true;

  if (from || to) {
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    filter[useScheduled ? "scheduledAt" : "createdAt"] = dateFilter;
  }

  const sort = useScheduled ? { scheduledAt: 1 } : { createdAt: -1 };
  return Event.find(filter).sort(sort).lean();
}

/**
 * (Se la tieni) Stats tenant-aware.
 * Nota: è "da eliminare" come dici tu, ma qui è corretta.
 */
export async function aggregateEventStats(req, { buildingIds = [], period = "month" }) {
  const { Event } = getTenantModels(req);

  const now = new Date();
  const from = new Date(now);

  if (period === "month") from.setMonth(now.getMonth() - 1);
  else if (period === "quarter") from.setMonth(now.getMonth() - 3);
  else if (period === "year") from.setFullYear(now.getFullYear() - 1);

  const grouping = period === "month" ? "day" : period === "quarter" ? "week" : "month";

  const buildingObjectIds = buildingIds.map((id) => new mongoose.Types.ObjectId(id));
  const timeField = "$createdAt";

  const groupKey =
    grouping === "day"
      ? { $dateToString: { format: "%Y-%m-%d", date: timeField } }
      : grouping === "month"
      ? { $dateToString: { format: "%Y-%m", date: timeField } }
      : { year: { $isoWeekYear: timeField }, week: { $isoWeek: timeField } };

  const pipeline = [
    {
      $match: {
        buildingId: { $in: buildingObjectIds },
        createdAt: { $gte: from, $lte: now },
      },
    },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalEvents: { $sum: 1 },
              scheduledEvents: {
                $sum: { $cond: [{ $ne: ["$scheduledAt", null] }, 1, 0] },
              },
              futureEvents: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$scheduledAt", null] },
                        { $gte: ["$scheduledAt", now] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        byReason: [{ $group: { _id: "$reason", count: { $sum: 1 } } }],
        timeline: [
          { $group: { _id: groupKey, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ];

  const [result] = await Event.aggregate(pipeline);
  return { result, from, to: now, grouping };
}
