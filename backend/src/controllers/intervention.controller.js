// src/controllers/intervention.controller.js
import { Intervention } from "../models/Intervention.js";
import { getInterventionsQuery } from "../repositories/intervention.repository.js";
import { parseCsvIds } from "../utils/queryParsing.js";

/**
 * GET /api/v1/interventions
 * - buildingIds (CSV) opzionale
 * - period opzionale (month|quarter|year)
 * - assetId opzionale
 */
export async function getInterventions(req, res) {
  try {
    const { period, assetId } = req.query;

    // 1) Validazione period (se presente)
    if (period && !["month", "quarter", "year"].includes(period)) {
      return res.status(400).json({
        message: "Parametro period non valido",
        allowed: ["month", "quarter", "year"],
      });
    }

    // 2) Normalizzo buildingIds (CSV) - se assente uso quelli dell'utente
    const requestedBuildingIds = req.query.buildingIds
      ? parseCsvIds(req.query.buildingIds) // -> array di stringhe
      : (req.user.buildingIds || []).map((id) => id.toString());

    // Se non ho edifici (caso limite) ritorno array vuoto
    if (!requestedBuildingIds.length) {
      return res.json([]);
    }

    // 3) 403: controllo che TUTTI i building richiesti siano associati all’utente
    const userBuildingIds = (req.user.buildingIds || []).map((id) => id.toString());
    const notAllowed = requestedBuildingIds.filter((id) => !userBuildingIds.includes(id));

    if (notAllowed.length) {
      return res.status(403).json({
        message: "Accesso negato: uno o più edifici non sono associati all’utente",
        notAllowedBuildingIds: notAllowed,
      });
    }

    // 4) Query repository (filtri combinabili)
    const interventions = await getInterventionsQuery({
      buildingIds: requestedBuildingIds,
      assetId,
      period: period || null,
    });

    return res.json(interventions);
  } catch (err) {
    return res.status(500).json({
      message: "Errore nel recupero interventi",
      error: err.message,
    });
  }
}

/**
 * GET /api/v1/interventions/:id
 */
export async function getInterventionById(req, res) {
  try {
    const intervention = await Intervention.findOne({
      _id: req.params.id,
      buildingId: { $in: req.user.buildingIds },
    }).lean();

    if (!intervention) {
      return res.status(404).json({ message: "Intervento non trovato" });
    }

    return res.json(intervention);
  } catch (err) {
    return res.status(500).json({
      message: "Errore nel recupero intervento",
      error: err.message,
    });
  }
}
