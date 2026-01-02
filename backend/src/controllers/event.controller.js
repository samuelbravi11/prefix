// controllers/event.controller.js
import mongoose from "mongoose";
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
    const { type, buildingId } = req.query;

    const filter = {};
    const now = new Date();

    /* -------------------------
       FILTRO PER EDIFICIO
    ------------------------- */
    if (buildingId) {
      const castedBuildingId = new mongoose.Types.ObjectId(buildingId);

      const allowed = req.user.buildingIds.some(
        id => id.toString() === castedBuildingId.toString()
      );

      if (!allowed) {
        return res.status(403).json({
          message: "Non sei autorizzato a visualizzare eventi di questo edificio"
        });
      }

      filter.buildingId = castedBuildingId;
    } else {
      filter.buildingId = {
        $in: req.user.buildingIds.map(id =>
          typeof id === "string" ? new mongoose.Types.ObjectId(id) : id
        )
      };
    }

    /* -------------------------
       FILTRO PER TIPO
    ------------------------- */
    if (type === "calendar") {
      filter.scheduledAt = { $ne: null };
    }

    if (type === "future") {
      filter.scheduledAt = { $gte: now };
    }

    /* -------------------------
       ORDINAMENTO
    ------------------------- */
    const sort =
      type === "calendar" || type === "future"
        ? { scheduledAt: 1 }       // prossimi eventi prima
        : { createdAt: -1 };       // registro storico

    const events = await Event.find(filter).sort(sort).lean();

    res.json(events);
  } catch (err) {
    res.status(500).json({
      message: "Errore nel recupero eventi",
      error: err.message
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
