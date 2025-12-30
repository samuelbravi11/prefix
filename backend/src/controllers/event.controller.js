// controllers/event.controller.js
import Event from "../models/Event.js";

/*
  Restituisce gli eventi associati
  agli edifici dell’utente
*/
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({
      buildingId: { $in: req.user.buildingIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(events);
  } catch (err) {
    res.status(500).json({
      message: "Errore nel recupero eventi",
      error: err.message,
    });
  }
};

/*
  Restituisce il dettaglio di un singolo evento
*/
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      buildingId: { $in: req.user.buildingIds },
    }).lean();

    if (!event) {
      return res.status(404).json({ message: "Evento non trovato" });
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({
      message: "Errore nel recupero evento",
      error: err.message,
    });
  }
};
