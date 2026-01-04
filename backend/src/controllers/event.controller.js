import Event from "../models/Event.js";
import {
  parseRequestedBuildingIds,
  resolveAllowedBuildingIds,
  findEvents,
  aggregateEventStats,
} from "../repositories/event.repository.js";
import { getDateRange } from "../services/dateRanges.service.js";

/*
  GET /api/v1/events

  Query supportate:
  - buildingIds=id1,id2        → eventi di specifici edifici
  - type=calendar              → solo eventi con scheduledAt != null
  - future=true                → solo eventi futuri
*/
export const getEvents = async (req, res) => {
  try {
    console.log("\n=== GET EVENTS (FINAL) ===");

    const { buildingIds, view } = req.query;
    const now = new Date();

    console.log("[DEBUG] raw query:", req.query);
    console.log("[DEBUG] server now:", now.toISOString());

    // 1. BUILDING IDS (CSV)
    let targetBuildingIds;

    if (buildingIds) {
      targetBuildingIds = buildingIds
        .split(",")
        .map(id => id.trim())
        .filter(Boolean);

      const userBuildings = req.user.buildingIds.map(String);
      const forbidden = targetBuildingIds.filter(
        id => !userBuildings.includes(id)
      );

      if (forbidden.length) {
        return res.status(403).json({
          message: "Accesso negato a uno o più edifici",
          forbiddenBuildingIds: forbidden
        });
      }
    } else {
      targetBuildingIds = req.user.buildingIds;
    }

    // 2. FILTRO BASE
    const filter = {
      buildingId: { $in: targetBuildingIds }
    };

    // 3. VIEW LOGIC (UNICA)
    if (view === "calendar") {
      filter.scheduledAt = { $ne: null };
    }

    if (view === "future") {
      filter.scheduledAt = {
        $ne: null,
        $gte: now
      };
    }

    console.log("[DEBUG] FINAL FILTER:", JSON.stringify(filter, null, 2));

    // 4. SORT
    const sort =
      view === "calendar" || view === "future"
        ? { scheduledAt: 1 }
        : { createdAt: -1 };

    // 5. QUERY
    const events = await Event.find(filter)
      .sort(sort)
      .lean();

    console.log("[DEBUG] returned:", events.length);

    return res.json(events);
  } catch (err) {
    console.error("[GET EVENTS ERROR]", err);
    return res.status(500).json({
      message: "Errore nel recupero eventi",
      error: err.message
    });
  }
};


/*
  GET /api/v1/events/:id
*/
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      buildingId: { $in: req.user.buildingIds }
    }).lean();

    if (!event) {
      return res.status(404).json({
        message: "Evento non trovato"
      });
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({
      message: "Errore nel recupero evento",
      error: err.message
    });
  }
};

/*
  GET /api/v1/events/stats --> da eliminare
*/
export const getEventStats = async (req, res) => {
  try {
    const { buildingIds, type, future, period } = req.query;

    /*
      BUILDINGS (CSV)
    */
    let targetBuildingIds = req.user.buildingIds.map(String);

    if (buildingIds) {
      const requested = buildingIds.split(",");

      const forbidden = requested.some(
        id => !targetBuildingIds.includes(id)
      );

      if (forbidden) {
        return res.status(403).json({
          message: "Accesso negato a uno o più edifici"
        });
      }

      targetBuildingIds = requested;
    }

    /*
      MATCH BASE
    */
    const match = {
      buildingId: { $in: targetBuildingIds }
    };

    /*
      CALENDAR VIEW
    */
    if (type === "calendar") {
      match.scheduledAt = { $ne: null };
    }

    /*
      EVENTI FUTURI
    */
    if (future === "true") {
      match.scheduledAt = { $gte: new Date() };
    }

    /*
      PERIODO
    */
    let dateMatch = {};
    if (period) {
      const { from, to } = getDateRange(period);
      dateMatch = {
        createdAt: { $gte: from, $lte: to }
      };
    }

    /*
      AGGREGAZIONE
    */
    const pipeline = [
      { $match: { ...match, ...dateMatch } },

      {
        $facet: {
          counters: [
            { $count: "total" }
          ],

          byReason: [
            {
              $group: {
                _id: "$reason",
                count: { $sum: 1 }
              }
            }
          ],

          byStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ];

    const [result] = await Event.aggregate(pipeline);

    res.json({
      buildings: targetBuildingIds,
      filters: { type, future, period },

      totalEvents: result.counters[0]?.total || 0,

      byReason: result.byReason,
      byStatus: result.byStatus
    });

  } catch (err) {
    res.status(500).json({
      message: "Errore nel calcolo statistiche eventi",
      error: err.message
    });
  }
};
