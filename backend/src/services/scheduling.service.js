// services/scheduling.service.js

/**
 * Calcola la data di esecuzione di un evento basato su regole
 * @param {Date} evaluatedAt - momento della valutazione (now)
 * @param {number} windowDays - finestra suggerita (default 7)
 */
export function computeScheduledAtForRule({
  evaluatedAt,
  windowDays = 7,
}) {
  const scheduledAt = new Date(evaluatedAt);
  scheduledAt.setDate(scheduledAt.getDate() + windowDays);

  return scheduledAt;
}
