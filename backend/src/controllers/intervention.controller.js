// controllers/intervention.controller.js
import { Intervention } from "../models/Intervention.js";

/*
  Restituisce lo storico interventi
  degli edifici dell’utente
*/
export const getInterventions = async (req, res) => {
  try {
    const interventions = await Intervention.find({
      buildingId: { $in: req.user.buildingIds },
    })
      .sort({ performedAt: -1 })
      .lean();

    res.json(interventions);
  } catch (err) {
    res.status(500).json({
      message: "Errore nel recupero interventi",
      error: err.message,
    });
  }
};

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
