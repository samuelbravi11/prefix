// src/utils/queryParsing.js

/**
 * Parse di una query in formato CSV:
 * - "a,b,c" -> ["a","b","c"]
 * - "  a , b " -> ["a","b"]
 * - "" / undefined / null -> []
 */
export function parseCsvIds(value) {
  if (!value) return [];

  const parts = Array.isArray(value)
    ? value.flatMap((v) => String(v).split(","))
    : String(value).split(",");

  return [...new Set(parts.map((s) => s.trim()).filter(Boolean))];
}
