// src/controllers/dashboard.controller.js
import { getDateRange, getGranularity } from "../services/dateRanges.service.js";
import { getInterventionsStatsAggregation } from "../repositories/stats.repository.js";

/**
 * GET /api/v1/dashboard/stats
 *
 * Query params:
 * - period (required): month|quarter|year
 * - buildingId (optional): singolo id
 * - buildingIds (optional): lista (comma-separated o ripetuta)
 *
 * Output:
 * - totals (counts)
 * - percentages (byTypePct/bySeverityPct)
 * - timeline (bucketizzati)
 */
export async function getStats(req, res) {
  try {
    const { period, buildingId } = req.query;

    // buildingIds può arrivare come:
    // - stringa "a,b,c"
    // - array ["a","b"]
    let buildingIds = req.query.buildingIds;

    // ---- Validazioni base ----
    if (!period || !["month", "quarter", "year"].includes(period)) {
      return res.status(400).json({
        message: "Parametro period non valido",
        allowed: ["month", "quarter", "year"],
      });
    }

    // ---- Normalizzazione buildingIds input ----
    if (buildingId) {
      buildingIds = [buildingId];
    } else if (typeof buildingIds === "string") {
      buildingIds = buildingIds.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (Array.isArray(buildingIds)) {
      buildingIds = buildingIds.map((s) => String(s).trim()).filter(Boolean);
    } else {
      // default: tutti i buildings associati all'utente
      buildingIds = (req.user.buildingIds || []).map((id) => id.toString());
    }

    // se ancora vuoto -> niente dati, ma risposta coerente
    if (!buildingIds.length) {
      return res.json({
        meta: {
          period,
          granularity: getGranularity(period),
          buildings: [],
          from: null,
          to: null,
        },
        totals: { total: 0, byType: {}, bySeverity: {} },
        percentages: { byTypePct: {}, bySeverityPct: {} },
        timeline: [],
      });
    }

    // ---- 403: controllo accesso building ----
    const userBuildings = (req.user.buildingIds || []).map((id) => id.toString());
    const notAllowed = buildingIds.filter((id) => !userBuildings.includes(id));
    if (notAllowed.length) {
      return res.status(403).json({
        message: "Accesso negato: uno o più edifici non sono associati all’utente",
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

    // ---- Percentuali (calcolo backend: una sola volta) ----
    const total = totals.total || 0;

    const pct = (value) => (total ? Number(((value / total) * 100).toFixed(2)) : 0);

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
        buildings: buildingIds,
        from: from.toISOString(),
        to: to.toISOString(),
      },
      totals,
      percentages: {
        byTypePct,
        bySeverityPct,
      },
      timeline,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Errore nel calcolo statistiche",
      error: err.message,
    });
  }
}
