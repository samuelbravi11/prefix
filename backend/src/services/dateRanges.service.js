// src/services/dateRanges.service.js

/**
 * period:
 * - month   -> last 30 days circa (qui: 1 mese calendario indietro)
 * - quarter -> last 3 mesi
 * - year    -> last 12 mesi
 */
export function getDateRange(period) {
  const to = new Date();
  const from = new Date(to);

  switch (period) {
    case "month":
      from.setMonth(to.getMonth() - 1);
      break;
    case "quarter":
      from.setMonth(to.getMonth() - 3);
      break;
    case "year":
      from.setFullYear(to.getFullYear() - 1);
      break;
    default:
      throw new Error("Periodo non valido");
  }

  return { from, to };
}

/**
 * Ritorna la granularità coerente col periodo.
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
      return "day";
  }
}
