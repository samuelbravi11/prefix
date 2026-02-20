// src/controllers/category.controller.js
import { getTenantModels } from "../utils/tenantModels.js";

/**
 * GET /api/v1/categories
 * Lista categorie (tipologie asset). Solo categorie attive.
 */
export async function listCategories(req, res) {
  try {
    const { Category } = getTenantModels(req);

    const items = await Category.find({ isActive: true })
      .select("_id name description")
      .sort({ name: 1, _id: 1 })
      .lean();

    return res.json(items);
  } catch (err) {
    return res.status(500).json({
      message: "Errore caricamento categorie",
      error: err.message,
    });
  }
}