// src/services/dateRanges.service.js

/**
 * period:
 * - month   -> last 30 days circa (qui: 1 mese calendario indietro)
 * - quarter -> last 3 mesi
 * - year    -> last 12 mesi
 */
export function getDateRange(period) {
  const now = new Date();
  const from = new Date(now);

  switch (period) {
    case "month":
      from.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      from.setMonth(now.getMonth() - 3);
      break;
    case "year":
      from.setFullYear(now.getFullYear() - 1);
      break;
    default:
      throw new Error("Periodo non valido");
  }

  return { from, to: now };
}

/**
 * Granularity utile per il frontend (come interpretare timeline):
 * - month   -> day
 * - quarter -> week
 * - year    -> month
 */
export function getGranularity(period) {
  switch (period) {
    case "month":
      return "day";
    case "quarter":
      return "week";
    case "year":
      return "month";
    default:
      return null;
  }
}
