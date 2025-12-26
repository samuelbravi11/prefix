import Event from "../models/Event.js";
import Asset from "../models/Asset.js";
import { notifyEvent } from "./notification.service.js";

/* EVENT SERVICE PDP
  L'event service è responsabile di:
  - creare l’evento di business
  - rappresentare un fatto storico irreversibile
  - notificare gli utenti interessati tramite il Notification Service
  
  In particolare, il servizio:
  - persiste l'evento nel database;
  - genera notifiche interne tramite il Notification Service per informare gli utenti interessati della creazione o modifica dell'evento.
*/
export const createMaintenanceEvent = async ({ assetId, reason, data }) => {
  // recupero asset per buildingId
  const asset = await Asset.findById(assetId).lean();
  if (!asset) {
    throw new Error("Asset not found while creating event");
  }

  const event = await Event.create({
    assetId: asset._id,
    buildingId: asset.buildingId,
    reason,
    data,
  });

  // Creazione notifica interna tramite Notification Service
  await notifyEvent({
    type: "maintenance_created",
    event
  });

  return event;
}
