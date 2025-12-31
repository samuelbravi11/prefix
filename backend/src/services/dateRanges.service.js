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