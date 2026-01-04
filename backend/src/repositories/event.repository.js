import mongoose from "mongoose";
import Event from "../models/Event.js";

/*
  Calcola l'elenco di buildingIds richiesti dal client.
  Supporta:
  - ?buildingId=...
  - ?buildingIds[]=...&buildingIds[]=...
*/
export function parseRequestedBuildingIds(query) {
  const { buildingId, buildingIds } = query;

  const ids = [];

  if (buildingId) ids.push(buildingId);

  if (Array.isArray(buildingIds)) ids.push(...buildingIds);
  else if (typeof buildingIds === "string") ids.push(buildingIds); // se arriva singolo

  // rimuovi duplicati
  return [...new Set(ids)].filter(Boolean);
}

/*
  Confronta edifici richiesti con edifici autorizzati
  e torna l'intersezione.
  Se il client chiede edifici fuori dalla sua lista → 403
*/
export function resolveAllowedBuildingIds({ userBuildingIds, requestedBuildingIds }) {
  if (!requestedBuildingIds.length) {
    // se non chiede nulla → usa tutti quelli dell'utente
    return userBuildingIds;
  }

  const userSet = new Set(userBuildingIds.map(String));
  const reqSet = new Set(requestedBuildingIds.map(String));

  // se esiste un requestedId non presente nei building user → forbidden
  for (const id of reqSet) {
    if (!userSet.has(id)) {
      return { forbidden: true, allowed: [] };
    }
  }

  return { forbidden: false, allowed: requestedBuildingIds };
}


export async function findEvents({ buildingIds, type, future, from, to }) {
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

  // from/to → filtro su createdAt (registro) oppure scheduledAt se calendar/future?
  // Scelta consigliata:
  // - se type=calendar o future=true → filtri su scheduledAt
  // - altrimenti → filtri su createdAt
  const useScheduled = type === "calendar" || future === true;

  if (from || to) {
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    filter[useScheduled ? "scheduledAt" : "createdAt"] = dateFilter;
  }

  const sort =
    type === "calendar" || future === true
      ? { scheduledAt: 1 }
      : { createdAt: -1 };

  return Event.find(filter).sort(sort).lean();
}

// da eliminare
export async function aggregateEventStats({ buildingIds, period }) {
  const now = new Date();
  const from = new Date(now);

  // range temporale base
  if (period === "month") from.setMonth(now.getMonth() - 1);
  else if (period === "quarter") from.setMonth(now.getMonth() - 3);
  else if (period === "year") from.setFullYear(now.getFullYear() - 1);

  // grouping time unit
  const grouping =
    period === "month" ? "day" : period === "quarter" ? "week" : "month";

  const buildingObjectIds = buildingIds.map((id) => new mongoose.Types.ObjectId(id));

  // timeline grouping su scheduledAt se esiste, altrimenti createdAt
  // qui ha senso usare createdAt (registro eventi) come timeline
  const timeField = "$createdAt";

  // groupKey per timeline
  const groupKey =
    grouping === "day"
      ? { $dateToString: { format: "%Y-%m-%d", date: timeField } }
      : grouping === "month"
      ? { $dateToString: { format: "%Y-%m", date: timeField } }
      : {
          // week grouping: ISO week
          year: { $isoWeekYear: timeField },
          week: { $isoWeek: timeField },
        };

  const pipeline = [
    {
      $match: {
        buildingId: { $in: buildingObjectIds },
        createdAt: { $gte: from, $lte: now },
      },
    },

    // facet = 1 sola query, più risultati
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

        byStatus: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ],

        byReason: [
          { $group: { _id: "$reason", count: { $sum: 1 } } },
        ],

        timeline: [
          { $group: { _id: groupKey, count: { $sum: 1 } } },
          { $sort: { "_id": 1 } },
        ],
      },
    },
  ];

  const [result] = await Event.aggregate(pipeline);

  return { result, from, to: now, grouping };
}