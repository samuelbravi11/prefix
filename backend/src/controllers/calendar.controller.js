// controllers/calendar.controller.js
import { getTenantModels } from "../utils/tenantModels.js";

/*
  Restituisce gli eventi calendarizzati
  per gli edifici dell’utente
*/
export const getCalendar = async (req, res) => {
  try {
    const { Event } = getTenantModels(req);
    
    const events = await Event.find({
      buildingId: { $in: req.user.buildingIds },
      scheduledAt: { $ne: null },
    })
      .sort({ scheduledAt: 1 })
      .lean();

    res.json(events);
  } catch (err) {
    res.status(500).json({
      message: "Errore nel recupero calendario",
      error: err.message,
    });
  }
};