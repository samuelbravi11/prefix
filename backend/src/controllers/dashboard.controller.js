// src/controllers/dashboard.controller.js
import { getDateRange, getGranularity } from "../services/dateRanges.service.js";
import { getInterventionsStatsAggregation } from "../repositories/stats.repository.js";
import { parseCsvIds } from "../utils/queryParsing.js";

/**
 * GET /api/v1/dashboard/stats
 *
 * Query params:
 * - period (required): month|quarter|year
 * - buildingIds (optional, CSV): "id1,id2,id3"
 *
 * Regole:
 * - se buildingIds è omesso -> usa tutti i buildings associati all’utente (req.user.buildingIds)
 * - se buildingIds contiene un id non associato -> 403
 */
export async function getStats(req, res) {
  try {
    const { period } = req.query;

    // ---- Validazione period ----
    if (!period || !["month", "quarter", "year"].includes(period)) {
      return res.status(400).json({
        message: "Parametro period non valido",
        allowed: ["month", "quarter", "year"],
      });
    }

    // ---- buildingIds: solo CSV (o default user buildings) ----
    const requestedBuildingIds = parseCsvIds(req.query.buildingIds);

    const userBuildingIds = (req.user.buildingIds || []).map((id) =>
      id.toString()
    );

    // default: tutti gli edifici associati
    const buildingIds = requestedBuildingIds.length
      ? requestedBuildingIds
      : userBuildingIds;

    // se utente non ha edifici associati (o lista vuota) -> risposta coerente
    if (!buildingIds.length) {
      return res.json({
        meta: {
          period,
          granularity: getGranularity(period),
          buildingIds: [],
          from: null,
          to: null,
        },
        totals: {
          total: 0,
          byType: { maintenance: 0, inspection: 0, repair: 0, failure: 0 },
          bySeverity: { low: 0, medium: 0, high: 0 },
        },
        percentages: {
          byTypePct: { maintenance: 0, inspection: 0, repair: 0, failure: 0 },
          bySeverityPct: { low: 0, medium: 0, high: 0 },
        },
        timeline: [],
      });
    }

    // ---- 403: buildingIds richiesti devono essere subset dei buildingIds utente ----
    const notAllowed = buildingIds.filter((id) => !userBuildingIds.includes(id));
    if (notAllowed.length) {
      return res.status(403).json({
        message:
          "Accesso negato: uno o più edifici non sono associati all’utente",
        notAllowedBuildingIds: notAllowed,
      });
    }

    // ---- Date range + aggregation ----
    const { from, to } = getDateRange(period);

    const { totals, timeline } = await getInterventionsStatsAggregation({
      buildingIds,
      period,
      from,
      to,
    });

    // ---- Percentuali (calcolo una sola volta) ----
    const total = totals.total || 0;
    const pct = (value) =>
      total ? Number(((value / total) * 100).toFixed(2)) : 0;

    const byTypePct = {
      maintenance: pct(totals.byType.maintenance || 0),
      inspection: pct(totals.byType.inspection || 0),
      repair: pct(totals.byType.repair || 0),
      failure: pct(totals.byType.failure || 0),
    };

    const bySeverityPct = {
      low: pct(totals.bySeverity.low || 0),
      medium: pct(totals.bySeverity.medium || 0),
      high: pct(totals.bySeverity.high || 0),
    };

    return res.json({
      meta: {
        period,
        granularity: getGranularity(period),
        buildingIds,
        from: from.toISOString(),
        to: to.toISOString(),
      },
      totals,
      percentages: { byTypePct, bySeverityPct },
      timeline,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Errore nel calcolo statistiche",
      error: err.message,
    });
  }
}
