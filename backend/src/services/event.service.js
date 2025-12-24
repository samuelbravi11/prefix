import db from "../config/db.js";
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
export const createMaintenanceEvent = async (eventData) => {
  // Persistenza evento nel DB
  const event = await db.events.insert({
    assetId: eventData.assetId,
    reason: eventData.reason, // RULE_BASED | AI_PREDICTIVE
    payload: eventData.data,
    createdAt: new Date()
  });

  // Creazione notifica interna tramite Notification Service
  await notifyEvent({
    type: "MAINTENANCE_CREATED",
    event
  });

  return event
}
