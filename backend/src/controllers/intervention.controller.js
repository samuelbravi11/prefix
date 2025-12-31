// controllers/intervention.controller.js
import { Intervention } from "../models/Intervention.js";
import { getInterventionsQuery } from "../repositories/intervention.repository.js";

/*
  Restituisce lo storico interventi
  degli edifici dell’utente
*/
export async function getInterventions(req, res) {
  try {
    console.log("REQ.USER COMPLETO:", req.user);
    console.log("BUILDING IDS:", req.user.buildingIds);
    console.log("BUILDING IDS TYPE:", typeof req.user.buildingIds);
    console.log(
      "BUILDING IDS ARRAY:",
      Array.isArray(req.user.buildingIds)
    );


    const { period, assetId } = req.query;

    if (period && !["month", "quarter", "year"].includes(period)) {
      return res.status(400).json({
        message: "Parametro period non valido",
        allowed: ["month", "quarter", "year"]
      });
    }

    const interventions = await getInterventionsQuery({
      buildingIds: req.user.buildingIds,
      assetId,
      period
    });

    res.json(interventions);
  } catch (err) {
    res.status(500).json({
      message: "Errore nel recupero interventi",
      error: err.message
    });
  }
}

/*
  Restituisce dettaglio intervento
*/
export const getInterventionById = async (req, res) => {
  try {
    const intervention = await Intervention.findOne({
      _id: req.params.id,
      buildingId: { $in: req.user.buildingIds },
    }).lean();

    if (!intervention) {
      return res.status(404).json({
        message: "Intervento non trovato",
      });
    }

    res.json(intervention);
  } catch (err) {
    res.status(500).json({
      message: "Errore nel recupero intervento",
      error: err.message,
    });
  }
};
