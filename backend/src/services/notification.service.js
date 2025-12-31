import Notification from "../models/Notification.js";
import { resolveUserByRoleAndBuilding } from "../utils/notification.js";

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
  let notification = null;

  switch (type) {
    case "maintenance_created":
      notification = await buildMaintenanceNotification(event);
      break;

    default:
      // evento non notificabile
      return;
  }

  if (!notification) return;

  // Persistenza DB (storico notifiche)
  await Notification.create(notification);

  // Invio realtime al Proxy (best effort)
  try {
    await fetch(`${process.env.PROXY_INTERNAL_URL}/internal/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-proxy": "true",
      },
      body: JSON.stringify(notification),
    });
  } catch (err) {
    console.error("[notifyEvent] Proxy WS error:", err.message);
  }
};


// Costruisce la notifica di creazione intervento manutenzione
async function buildMaintenanceNotification(event) {
  /*
    Destinatari:
    - Admin locale dell’edificio
  */
  const targetUserId = await resolveUserByRoleAndBuilding({
    roleName: "admin_locale",
    buildingId: event.buildingId,
  });

  // Titolo e messaggio dipendono dal motivo dell’evento
  const { title, message, priority } = resolveContentByReason(event);

  return {
    type: "CREAZIONE_INTERVENTO",

    title,
    message,
    priority,

    // targeting
    recipient: targetUserId ? { userId: targetUserId } : null,
    targetRole: targetUserId ? null : "admin_locale",
    targetBuildingId: event.buildingId,

    // collegamenti
    relatedEventId: event._id,

    // metadati di sistema
    createdAt: new Date(),
    read: false,
    readBy: [],
  };
}

function resolveContentByReason(event) {
  switch (event.reason) {
    case "ai_predictive":
      return {
        title: "Manutenzione suggerita dall’AI",
        message: buildAIPredictiveMessage(event),
        priority: "high",
      };

    case "rule_based":
      return {
        title: "Manutenzione programmata",
        message: buildRuleBasedMessage(event),
        priority: "medium",
      };

    default:
      return {
        title: "Nuovo evento di manutenzione",
        message: "È stato creato un nuovo evento di manutenzione.",
        priority: "medium",
      };
  }
}

function buildAIPredictiveMessage(event) {
  const risk = event.data?.riskLevel ?? "non disponibile";
  return `L’AI ha rilevato un possibile rischio (${risk}). È consigliato pianificare un intervento.`;
}

function buildRuleBasedMessage(event) {
  const count = event.data?.dueRuleIds?.length ?? 1;
  return `${count} regole di manutenzione risultano scadute.`;
}