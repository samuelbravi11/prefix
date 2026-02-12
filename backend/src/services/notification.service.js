// src/services/notification.service.js
import { findUserIdsByPermission } from "./notificationRecipients.service.js";

function permissionForNotification(type) {
  switch (type) {
    case "maintenance_created":
      return "events:view";
    default:
      return null;
  }
}

export const notifyEvent = async (ctx, { type, event }) => {
  const requiredPermission = permissionForNotification(type);
  if (!requiredPermission) return;

  const payload = buildNotificationPayload(type, event);
  if (!payload) return;

  const buildingId = event?.buildingId ? String(event.buildingId) : null;

  const userIds = await findUserIdsByPermission(ctx, {
    permissionName: requiredPermission,
    buildingId,
    onlyActive: true,
    onlyOptIn: true,
  });

  if (!userIds.length) return;

  const { Notification } = ctx.models;

  const now = new Date();
  const docs = userIds.map((uid) => ({
    type: payload.type,
    title: payload.title,
    message: payload.message,
    priority: payload.priority,
    recipient: { userId: uid },
    targetBuildingId: payload.targetBuildingId || null,
    relatedEventId: payload.relatedEventId || null,
    createdAt: now,
    read: false,
    readBy: [],
  }));

  await Notification.insertMany(docs);

  // Chiamata al proxy con timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 secondi

    await fetch(`${process.env.PROXY_INTERNAL_URL}/internal/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-proxy": "true",
        "x-internal-secret": process.env.INTERNAL_PROXY_SECRET || "",
      },
      body: JSON.stringify({ userIds, event: payload }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (err) {
    // fallback silenzioso: la notifica è già salvata nel DB
    console.error("[notifyEvent] Proxy WS error (timeout or network):", err.message);
  }
};

function buildNotificationPayload(type, event) {
  switch (type) {
    case "maintenance_created": {
      const { title, message, priority } = resolveContentByReason(event);
      return {
        type: "CREAZIONE_INTERVENTO",
        title,
        message,
        priority,
        relatedEventId: event._id,
        targetBuildingId: event.buildingId || null,
      };
    }
    default:
      return null;
  }
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