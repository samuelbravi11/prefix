import db from "../config/db.js";
/*  NOTIFICATION SERVICE PDP
  Il notification service ha il compito di:
  - riceve eventi di dominio (event.service.js, come la creazione di un evento di manutenzione);
  - decide come e a chi notificare
  - assegna automaticamente metadati di sistema (timestamp, stato di lettura);
  - persiste le notifiche nel database;
  - delega la consegna in tempo reale al Proxy Server, inviando un evento interno protetto tramite endpoint dedicato (internal/events). Solo il server interno può chiamare questa route grazie ad un token specifico (x-internal-proxy).

  Il notification.service non conosce né gestisce le connessioni WebSocket, né l’identità dei client connessi.
  La responsabilità della distribuzione delle notifiche in tempo reale è demandata al Proxy Server, che agisce come gateway applicativo e punto di accesso unico per i client.
 */
export const notifyEvent = async ({ type, event }) => {
  let notification;
  
  switch (type) {
    case "MAINTENANCE_CREATED":
      notification = buildMaintenanceNotification(event);
      break;

    default:
      return;
  }
  
  // Persistenza DB --> inserisco notifica nel DB così l'utente può visualizzarla in futuro dopo il login e quindi la creazione socket
  await db.notifications.insert(notification);

  // Invio evento al Proxy Server (WebSocket Gateway) --> mando evento in realtime per l'utente online in base a userId/role/buildingId
  // Chiama la route interna protetta /internal/events del proxy che si occupa di emettere l'evento WS verso i client connessi in base a userId/role/buildingId (rooms)
  await fetch(`${process.env.PROXY_INTERNAL_URL}/internal/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-proxy": "true"
    },
    body: JSON.stringify(notification)
  });
};

// Costruisce la notifica di creazione intervento manutenzione
// notification.service.js
function buildMaintenanceNotification(event, targetUserId = null) {
  return {
    type: "CREAZIONE_INTERVENTO",
    title: "Nuovo intervento pianificato",
    message: `È stato pianificato un intervento di manutenzione`,
    priority: "alta",
    // Se targetUserId è fornito, notifica specifica
    recipient: targetUserId ? {
      userId: targetUserId,
      role: null
    } : null,
    // Altrimenti notifica per ruolo
    targetRole: "admin_locale",
    targetBuildingId: event.buildingId ?? null,
    relatedEventId: event.id,
    createdAt: new Date(),
    read: false,
    readBy: []
  };
}
