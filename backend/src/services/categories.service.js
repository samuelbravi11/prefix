// src/services/categories.service.js
import api from "./api";

/**
 * GET /api/v1/categories
 */
export async function listCategories() {
  const res = await api.get("/categories");
  return Array.isArray(res.data) ? res.data : [];
}