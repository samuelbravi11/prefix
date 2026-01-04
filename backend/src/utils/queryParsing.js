// src/utils/queryParsing.js

/**
 * Parse di una query in formato CSV:
 * - "a,b,c" -> ["a","b","c"]
 * - "  a , b " -> ["a","b"]
 * - "" / undefined / null -> []
 */
export function parseCsvIds(value) {
  if (!value) return [];

  // accettiamo anche accidentalmente array (es. ?buildingIds=a&buildingIds=b)
  if (Array.isArray(value)) {
    return value
      .flatMap((v) => String(v).split(",")) // nel dubbio supporto anche "a,b" dentro array
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
