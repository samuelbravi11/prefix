// controllers/event.controller.js
import Event from "../models/Event.js";

/*
  Restituisce gli eventi associati
  agli edifici dell’utente

  GET /api/v1/events
  - default: tutti gli eventi --> “Quali eventi di manutenzione esistono per i miei edifici?” (Registro completo degli eventi)
  - ?type=calendar --> “Quali interventi sono già pianificati e quando devo eseguirli?” (Agenda delle cose da fare)
*/
export const getEvents = async (req, res) => {
  try {
    const filter = {
      buildingId: { $in: req.user.buildingIds },
    };

    // vista calendario
    if (req.query.type === "calendar") {
      filter.scheduledAt = { $ne: null };
    }

    const sort =
      req.query.type === "calendar"
        ? { scheduledAt: 1 }
        : { createdAt: -1 };

    const events = await Event.find(filter).sort(sort).lean();

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
